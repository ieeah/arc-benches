/**
 * Sincronizza i dati completi delle quest narrative dei commercianti (123 quest)
 * incrociando MetaForge (albero, nodi, posizioni canvas, ricompense) e ARC Tracker
 * (nomi italiani ufficiali, descrizioni e obiettivi localizzati).
 *
 * Le 15 ricerche della Research Station (amplificazioni armi) vengono isolate
 * ed esportate a parte in src/data/weapon-amplification-research.json.
 *
 * Output:
 *  - src/data/quests-source.json (albero e grafo completo per visualizzazione/editing)
 *  - src/data/quests.json        (elenco QuestList conformato al modello List per l'app)
 *  - src/data/weapon-amplification-research.json (le 15 ricerche Research Station per le armi)
 *
 * Uso:
 *  node scripts/fetch-quests.mjs            (usa la cache se presente)
 *  node scripts/fetch-quests.mjs --refresh  (riscarica da MetaForge e ARC Tracker)
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadArcTracker, extractList, normalizeId } from './lib/arctracker.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const METAFORGE_CACHE = join(__dirname, 'metaforge-quests-raw.json');
const ARCTRACKER_CACHE = join(__dirname, 'arctracker-raw.json');

const QUESTS_SOURCE_PATH = join(ROOT, 'src', 'data', 'quests-source.json');
const QUESTS_JSON_PATH = join(ROOT, 'src', 'data', 'quests.json');
const AMP_RESEARCH_PATH = join(ROOT, 'src', 'data', 'weapon-amplification-research.json');

const TRADER_MAP = {
  celeste: 'celeste',
  shani: 'shani',
  apollo: 'apollo',
  'tian wen': 'tian_wen',
  tianwen: 'tian_wen',
  lance: 'lance',
  ermal: 'ermal',
};

function normalizeTrader(rawTrader) {
  const norm = String(rawTrader || '').toLowerCase().trim();
  return TRADER_MAP[norm] || norm.replace(/\s+/g, '_');
}

function normalizeItemId(rawId) {
  if (!rawId) return 'unknown';
  const id = String(rawId).toLowerCase().trim().replace(/_/g, '-');
  // Se finisce con -recipe o -blueprint ma è un comune materiale, rimuovi il suffisso
  if (id.endsWith('-recipe') && !id.includes('blueprint')) {
    return id.replace(/-recipe$/, '');
  }
  return id;
}

async function fetchMetaForgeQuests(refresh = false) {
  if (!refresh && existsSync(METAFORGE_CACHE)) {
    console.log(`Uso cache MetaForge quests da ${METAFORGE_CACHE}`);
    return JSON.parse(readFileSync(METAFORGE_CACHE, 'utf-8'));
  }

  console.log('Scaricamento delle quest da MetaForge API…');
  const all = [];
  let page = 1;
  while (true) {
    const url = `https://metaforge.app/api/arc-raiders/quests?limit=100&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MetaForge quests HTTP ${res.status}`);
    const json = await res.json();
    all.push(...json.data);
    if (!json.pagination?.hasNextPage) break;
    page++;
  }

  writeFileSync(METAFORGE_CACHE, JSON.stringify(all, null, 2), 'utf-8');
  console.log(`Scaricate ${all.length} quest da MetaForge (cache salvata).`);
  return all;
}

async function main() {
  const refresh = process.argv.includes('--refresh');

  console.log('=== ARC Benches — Sincronizzatore Quest ===\n');

  // 1. Carica MetaForge
  const mfQuests = await fetchMetaForgeQuests(refresh);

  // 2. Carica ARC Tracker
  console.log('Caricamento dati ARC Tracker…');
  const arcData = await loadArcTracker({
    cachePath: ARCTRACKER_CACHE,
    refresh,
    log: (m) => console.log(`  ${m}`),
  });
  const arcQuests = extractList('quests', arcData.quests);
  console.log(`Caricate ${arcQuests.length} quest totali da ARC Tracker.\n`);

  // Indicizzazione ARC Tracker per matching
  const arcByName = new Map();
  const arcById = new Map();
  for (const q of arcQuests) {
    if (q.name?.en) arcByName.set(q.name.en.toLowerCase().trim(), q);
    if (q.id) arcById.set(normalizeId(q.id), q);
  }

  // 3. Separa le 15 ricerche della Research Station per le armi amplificate
  const rsQuests = arcQuests.filter((q) => q.trader === 'Research Station');
  console.log(`Isolamento delle ${rsQuests.length} ricerche per Stazione di Ricerca (amplificazioni armi)…`);

  const weaponResearchData = rsQuests.map((q) => ({
    id: normalizeId(q.id),
    name: q.name?.en || q.id,
    translations: {
      it: {
        name: q.name?.it || q.name?.en || q.id,
      },
    },
    xp: q.xp ?? null,
    objectives: (q.objectives || []).map((obj) => ({
      en: obj.en || '',
      it: obj.it || obj.en || '',
    })),
  }));

  writeFileSync(AMP_RESEARCH_PATH, JSON.stringify(weaponResearchData, null, 2) + '\n', 'utf-8');
  console.log(`✓ Salvate 15 ricerche armi in ${AMP_RESEARCH_PATH}\n`);

  // 4. Elaborazione delle 123 Quest dei Commercianti
  console.log(`Elaborazione delle ${mfQuests.length} quest dei commercianti…`);

  const nodes = [];
  const edges = [];
  const lists = [];

  for (const mf of mfQuests) {
    const arcMatch = arcByName.get(mf.name.toLowerCase().trim()) || arcById.get(normalizeId(mf.id));
    const trader = normalizeTrader(mf.trader_name);

    // Prerequisiti
    const prereqs = (mf.manifest?.prerequisites || []).map((p) => p.quest_id);
    for (const prereqId of prereqs) {
      edges.push({
        id: `${prereqId}->${mf.id}`,
        source: prereqId,
        target: mf.id,
      });
    }

    // Traduzioni
    const itName = arcMatch?.name?.it || mf.name;
    const itDesc = arcMatch?.description?.it || mf.description || '';

    // Obiettivi / Azioni
    const actions = (mf.objectives || []).map((obj, i) => {
      const itLabel = arcMatch?.objectives?.[i]?.it || obj;
      return {
        id: `${mf.id}-action-${i + 1}`,
        label: obj,
        translations: {
          it: { label: itLabel },
        },
      };
    });

    // Ricompense
    const rewards = (mf.rewards || []).map((r) => ({
      itemId: normalizeItemId(r.item_id),
      quantity: r.quantity || 1,
    }));

    // Oggetti richiesti
    const requirementItemIds = (mf.required_items || []).map((r) => ({
      itemId: normalizeItemId(r.item_id),
      quantity: r.quantity || 1,
    }));

    // XP da additional_rewards o campo xp
    const xpReward =
      mf.additional_rewards?.find((r) => r.name === 'XP')?.quantity ||
      mf.xp ||
      arcMatch?.xp ||
      0;

    // Nodo per quests-source.json
    nodes.push({
      id: mf.id,
      metaforgeId: mf.id,
      name: mf.name,
      nameIT: itName,
      trader,
      map: arcMatch?.map || null,
      description: mf.description || '',
      descriptionIT: itDesc,
      position: mf.position || { x: 0, y: 0 },
      image: mf.image || null,
      xp: xpReward,
      prerequisites: prereqs,
      rewards,
      requiredItems: requirementItemIds,
      objectives: (mf.objectives || []).map((obj, i) => ({
        en: obj,
        it: arcMatch?.objectives?.[i]?.it || obj,
      })),
    });

    // Oggetto List per quests.json
    lists.push({
      id: mf.id,
      name: mf.name,
      translations: {
        it: {
          name: itName,
          ...(itDesc ? { description: itDesc } : {}),
        },
      },
      maxLevel: 1,
      listType: 'quest',
      trader,
      ...(prereqs.length > 0 ? { prerequisites: prereqs } : {}),
      levels: [
        {
          level: 1,
          requirementItemIds,
          ...(actions.length > 0 ? { actions } : {}),
          ...(rewards.length > 0 ? { rewards } : {}),
        },
      ],
      description: mf.description || undefined,
    });
  }

  // Ordina nodi e liste per ID
  nodes.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => a.id.localeCompare(b.id));
  lists.sort((a, b) => a.id.localeCompare(b.id));

  // Scrivi quests-source.json
  const sourcePayload = {
    _meta: {
      description:
        'Dati completi delle 123 quest dei commercianti di Speranza. Nodi, posizioni canvas e reward da MetaForge; traduzioni IT ufficiali da ARC Tracker.',
      sources: [
        'https://metaforge.app/api/arc-raiders/quests',
        'https://arctracker.io/api/quests',
      ],
      totalQuests: nodes.length,
      totalEdges: edges.length,
      extractedAt: new Date().toISOString().slice(0, 10),
    },
    nodes,
    edges,
  };

  writeFileSync(QUESTS_SOURCE_PATH, JSON.stringify(sourcePayload, null, 2) + '\n', 'utf-8');
  console.log(`✓ Generato ${QUESTS_SOURCE_PATH} (${nodes.length} nodi, ${edges.length} archi).`);

  // Scrivi quests.json
  const listsPayload = {
    lists,
  };

  writeFileSync(QUESTS_JSON_PATH, JSON.stringify(listsPayload, null, 2) + '\n', 'utf-8');
  console.log(`✓ Generato ${QUESTS_JSON_PATH} (${lists.length} quest pronte per il modello List).\n`);

  console.log('=== Sincronizzazione completata con successo! ===');
}

main().catch((err) => {
  console.error('Errore durante la sincronizzazione:', err);
  process.exit(1);
});
