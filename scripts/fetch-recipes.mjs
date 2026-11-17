#!/usr/bin/env node
/**
 * Estrae le ricette di costruzione, i costi di miglioramento livello (I->IV / Amplificato),
 * i costi di riparazione e le ricette di riciclo/smantellamento da ARC Tracker,
 * normalizzandoli secondo il catalogo hyphen-case del progetto.
 *
 * Modellazione:
 *   - benches: Record<string, StationRequirement> (stazioni abilitate con requisiti indipendenti di livello o skill)
 *
 * Uso:
 *   node scripts/fetch-recipes.mjs           # usa la cache locale arctracker-raw.json
 *   node scripts/fetch-recipes.mjs --refresh # riscarica prima da arctracker.io
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { extractList } from './lib/arctracker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REFRESH = process.argv.includes('--refresh');
const RAW_CACHE_PATH = join(__dirname, 'arctracker-raw.json');
const OUTPUT_PATH = join(__dirname, '../src/data/recipes.json');
const ITEMS_JSON_PATH = join(__dirname, '../src/data/items.json');

// Mappa alias per discrepanze di nomenclatura tra ARC Tracker e il nostro catalogo
const ID_ALIASES = {
  'great_mullein': 'great-muullein',
  'great-mullein': 'great-muullein',
  'sheetmetal': 'sheet-metal',
  'steel_spring': 'spring',
  'steel-spring': 'spring',
  'rocketeer_driver': 'rocketeer-part',
  'rocketeer-driver': 'rocketeer-part',
  'burletta_iii': 'burletta-iiii',
  'burletta-iii': 'burletta-iiii',
  'il_toro_iii': 'il-toro-iiii',
  'il-toro-iii': 'il-toro-iiii',
};

/** Normalizza un ID generico in hyphen-case con risoluzione degli alias e formato amplified */
function mapItemId(rawId) {
  if (!rawId) return '';
  let s = String(rawId).trim().toLowerCase().replace(/_/g, '-');
  if (ID_ALIASES[s]) return ID_ALIASES[s];
  if (ID_ALIASES[rawId]) return ID_ALIASES[rawId];

  // Regola di trasformazione per le armi amplificate:
  // ARC Tracker usa: {arma}_amplified_{perk}
  // Nostro catalogo MetaForge usa: amplified-{arma}-{perk}
  if (s.includes('-amplified')) {
    const parts = s.split('-amplified');
    const weaponName = parts[0];
    const rest = parts[1] || '';
    s = 'amplified-' + weaponName + rest;
  }

  return ID_ALIASES[s] || s;
}

/** Normalizza una mappa di costi { [id]: quantity } */
function normalizeCostMap(costObj) {
  if (!costObj || typeof costObj !== 'object') return undefined;
  const out = {};
  let count = 0;
  for (const [rawKey, qty] of Object.entries(costObj)) {
    const normKey = mapItemId(rawKey);
    const num = Number(qty);
    if (normKey && !Number.isNaN(num) && num > 0) {
      out[normKey] = num;
      count++;
    }
  }
  return count > 0 ? out : undefined;
}

/** Normalizza l'identificatore del singolo banco */
function normalizeStation(benchRaw) {
  if (!benchRaw) return 'workbench';
  const val = Array.isArray(benchRaw) ? benchRaw[0] : benchRaw;
  const cleaned = String(val).trim().toLowerCase().replace(/_/g, '-');
  return cleaned === 'in-raid' ? 'in-raid' : cleaned;
}

/** Estrae la mappa normalizzata dei banchi/ambienti abilitati e dei rispettivi requisiti */
function extractBenchesRequirement(craftBenchRaw, stationLevelRaw, craftSkillsRaw) {
  const benches = {};
  const allBenches = new Set();

  if (craftBenchRaw) {
    const rawList = Array.isArray(craftBenchRaw) ? craftBenchRaw : [craftBenchRaw];
    rawList.forEach(b => allBenches.add(normalizeStation(b)));
  }

  if (craftSkillsRaw && typeof craftSkillsRaw === 'object') {
    Object.keys(craftSkillsRaw).forEach(b => allBenches.add(normalizeStation(b)));
  }

  if (allBenches.size === 0) {
    allBenches.add('workbench');
  }

  for (const benchId of allBenches) {
    const req = {};
    if (benchId !== 'in-raid') {
      req.levelRequired = Number(stationLevelRaw) || 1;
    }

    if (craftSkillsRaw && typeof craftSkillsRaw === 'object') {
      const matchedKey = Object.keys(craftSkillsRaw).find(k => normalizeStation(k) === benchId);
      if (matchedKey && Array.isArray(craftSkillsRaw[matchedKey])) {
        const skills = craftSkillsRaw[matchedKey];
        if (skills.includes('surv_5c')) {
          req.skillRequired = 'surv_5c';
        } else if (skills.length > 0) {
          req.skillRequired = skills[0];
        }
      }
    }

    benches[benchId] = req;
  }

  return benches;
}

/** Normalizza i requisiti di upgrade (es. stazione o ricerche necessarie) */
function normalizeRequires(requiresRaw) {
  if (!Array.isArray(requiresRaw) || requiresRaw.length === 0) return undefined;
  const out = [];
  for (const r of requiresRaw) {
    if (!r) continue;
    if (typeof r === 'object') {
      if (r.station) {
        out.push({
          type: 'station',
          station: normalizeStation(r.station),
          level: Number(r.level) || 1,
        });
      } else if (r.itemId) {
        out.push({
          type: 'research',
          itemId: mapItemId(r.itemId),
        });
      }
    } else if (typeof r === 'string') {
      out.push({
        type: 'item',
        itemId: mapItemId(r),
      });
    }
  }
  return out.length > 0 ? out : undefined;
}

async function main() {
  console.log('--- Estrazione Ricette, Potenziamenti e Riparazioni ARC ---');

  let rawData;
  if (!REFRESH && existsSync(RAW_CACHE_PATH)) {
    console.log(`Caricamento cache locale: ${RAW_CACHE_PATH}`);
    rawData = JSON.parse(readFileSync(RAW_CACHE_PATH, 'utf-8'));
  } else {
    console.log('Scaricamento dati freschi da arctracker.io/api/items...');
    const res = await fetch('https://arctracker.io/api/items', {
      headers: { 'User-Agent': 'ARCBenchesCompanion/1.0 (+https://github.com/ieeah/scrappys-nest)' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} da ARC Tracker`);
    const json = await res.json();
    rawData = { fetchedAt: new Date().toISOString(), items: json };
    writeFileSync(RAW_CACHE_PATH, JSON.stringify(rawData, null, 2), 'utf-8');
  }

  const atItems = extractList('items', rawData.items);
  console.log(`Oggetti totali analizzati da ARC Tracker: ${atItems.length}`);

  let ourCatalog = {};
  if (existsSync(ITEMS_JSON_PATH)) {
    ourCatalog = JSON.parse(readFileSync(ITEMS_JSON_PATH, 'utf-8'));
  }

  const recipes = {};
  let totalCraftable = 0;
  let totalUpgradable = 0;
  let totalRepairable = 0;
  let totalRecyclable = 0;
  let totalMultiStation = 0;

  for (const it of atItems) {
    const itemId = mapItemId(it.id);
    if (!itemId) continue;

    const recipeData = {
      itemId,
    };

    // 1. Costruzione (Crafting)
    if (it.recipe && typeof it.recipe === 'object') {
      const ingredients = normalizeCostMap(it.recipe);
      if (ingredients) {
        const benches = extractBenchesRequirement(it.craftBench, it.stationLevelRequired, it.craftSkills);
        if (Object.keys(benches).length > 1) totalMultiStation++;

        recipeData.crafting = {
          benches,
          blueprintRequired: Boolean(it.blueprintLocked),
          craftQuantity: Number(it.craftQuantity) || 1,
          ingredients,
        };
        totalCraftable++;
      }
    }

    // 2. Potenziamento (Upgrades)
    const hasUpgradeCost = Boolean(it.upgradeCost);
    const hasUpgradesTo = Boolean(it.upgradesTo);
    const hasBranches = Array.isArray(it.upgrades) && it.upgrades.length > 0;

    if (hasUpgradeCost || hasUpgradesTo || hasBranches) {
      const upgradeInfo = {};
      if (hasUpgradeCost) {
        upgradeInfo.upgradeCost = normalizeCostMap(it.upgradeCost);
      }
      if (hasUpgradesTo) {
        upgradeInfo.upgradesTo = mapItemId(it.upgradesTo);
      }
      if (hasBranches) {
        upgradeInfo.branches = it.upgrades.map(b => ({
          to: mapItemId(b.to),
          cost: normalizeCostMap(b.cost) || {},
          requires: normalizeRequires(b.requires),
        })).filter(b => b.to && Object.keys(b.cost).length > 0);
      }
      recipeData.upgrade = upgradeInfo;
      totalUpgradable++;
    }

    // 3. Riparazione (Repair)
    if (it.repairCost && typeof it.repairCost === 'object') {
      const cost = normalizeCostMap(it.repairCost);
      if (cost) {
        recipeData.repair = {
          cost,
          durabilityRestored: Number(it.repairDurability) || 0.5,
        };
        totalRepairable++;
      }
    }

    // 4. Riciclo e Smantellamento (Recycling & Salvaging)
    const recyclesInto = normalizeCostMap(it.recyclesInto);
    const salvagesInto = normalizeCostMap(it.salvagesInto);
    if (recyclesInto || salvagesInto) {
      recipeData.recycling = {
        recyclesInto,
        salvagesInto,
      };
      totalRecyclable++;
    }

    // Aggiungi solo se ha almeno una informazione utile
    if (recipeData.crafting || recipeData.upgrade || recipeData.repair || recipeData.recycling) {
      recipes[itemId] = recipeData;
    }
  }

  const payload = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalItemsWithData: Object.keys(recipes).length,
    totalCraftable,
    totalUpgradable,
    totalRepairable,
    totalRecyclable,
    recipes,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`\nSalvato catalogo ricette in: ${OUTPUT_PATH}`);
  console.log(`Riepilogo:`);
  console.log(` - Oggetti con dati ricetta/manutenzione: ${payload.totalItemsWithData}`);
  console.log(` - Oggetti fabbricabili (crafting): ${totalCraftable}`);
  console.log(`   di cui con banchi multipli / in-raid: ${totalMultiStation}`);
  console.log(` - Oggetti con potenziamenti (upgrades): ${totalUpgradable}`);
  console.log(` - Oggetti riparabili (repair): ${totalRepairable}`);
  console.log(` - Oggetti riciclabili/smantellabili: ${totalRecyclable}`);
}

main().catch(err => {
  console.error('Errore:', err);
  process.exit(1);
});
