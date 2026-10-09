/**
 * IMPORT UNA TANTUM del Legacy Pass (dati estratti a mano, in italiano, da scripts/data/legacy-pass-source.md).
 *
 * Traduce nomi e categorie italiani nei nomi inglesi dei cosmetici di ARC Tracker (che ha entrambe le
 * lingue), li riconcilia con il nostro catalogo e confronta ogni riga con ciò che il sito dice per quel livello.
 * Scrive SOLO lo staging non distribuito `scripts/data/legacy-pass.json` e il rapporto in `scripts/reports/`:
 * non tocca src/ né i custom-items; il Legacy entrerà nei dati dell'app quando lo si deciderà.
 *
 * Con --apply-custom-items crea gli oggetti custom necessari (scripts/data/custom-items/items.json e src/data/items.json,
 * come li produrrebbe fetch-items). Con --apply-pass scrive il pass «legacy-pass» in src/data/passes.json
 * (dietro il feature flag reward-pass, quindi visibile nell'editor Dev e non agli utenti).
 *
 * Run: cd scripts && node oneshot/import-legacy-pass.mjs [--dry-run] [--apply-custom-items] [--apply-pass]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extractList, normalizeItem } from '../lib/arctracker.mjs';
import { loadCosmeticsPages, mergeLanguages, passSources } from '../lib/arctracker-cosmetics.mjs';
import { categoryToKind, matchCosmetic, parseLegacyMarkdown } from '../lib/legacy-matcher.mjs';
import { inheritPieceIcons, toCatalogItem, toCustomItem } from '../lib/custom-item-builder.mjs';
import { normName, resolveReward } from '../lib/pass-resolver.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(__dirname, '..');
const ROOT = join(SCRIPTS, '..');
const PATHS = {
  source: join(SCRIPTS, 'data', 'legacy-pass-source.md'),
  staging: join(SCRIPTS, 'data', 'legacy-pass.json'),
  cosmeticsRaw: join(SCRIPTS, 'arctracker-cosmetics-raw.json'),
  atRaw: join(SCRIPTS, 'arctracker-raw.json'),
  items: join(ROOT, 'src', 'data', 'items.json'),
  passes: join(ROOT, 'src', 'data', 'passes.json'),
  customItems: join(SCRIPTS, 'data', 'custom-items', 'items.json'),
  report: join(SCRIPTS, 'reports', 'legacy-pass-import.json'),
};
const LEGACY_DECK = 'legacy-pass';
const dry = process.argv.includes('--dry-run');

/** Suffisso con cui il risolutore riconosce il tipo (stesso formato dei nomi della tabella Polygon). */
const SUFFIX = {
  outfit: 'outfit',
  'backpack-attachment': 'backpack attachment',
  'backpack-charm': 'backpack charm',
  backpack: 'backpack',
  'face-style': 'face style',
  face: 'face',
  emote: 'emote',
  hair: 'hairstyle',
  'facial-hair': 'facial hair',
  'raider-tool': 'raider tool',
};

const readJson = (p) => JSON.parse(readFileSync(p, 'utf-8'));

function buildContext(items, cosmetics, atItems) {
  const catalog = new Map(Object.entries(items).map(([id, item]) => [normName(item.name), id]));
  const byKind = new Map();
  for (const c of cosmetics) {
    if (!c.names.en) continue;
    if (!byKind.has(c.kind)) byKind.set(c.kind, new Map());
    byKind.get(c.kind).set(normName(c.names.en), c);
  }
  return { catalog, cosmetics: byKind, atItems: new Map(atItems.map((i) => [normName(i.names.en ?? i.id), i])) };
}

async function main() {
  for (const needed of [PATHS.source, PATHS.atRaw]) if (!existsSync(needed)) throw new Error(`Manca ${needed}`);
  const rows = parseLegacyMarkdown(readFileSync(PATHS.source, 'utf-8'));
  const items = readJson(PATHS.items);
  const customItems = readJson(PATHS.customItems);
  const atItems = extractList('items', readJson(PATHS.atRaw).items).map(normalizeItem);
  const pages = await loadCosmeticsPages({ cachePath: PATHS.cosmeticsRaw });
  const cosmetics = mergeLanguages(pages.pages);
  const ctx = buildContext(items, cosmetics, atItems);

  // Cosa il sito dice per ogni livello del Legacy: cosmetici e opzioni (pezzi degli outfit)
  const siteByLevel = new Map();
  for (const c of cosmetics) {
    for (const s of passSources(c, LEGACY_DECK)) {
      if (!siteByLevel.has(s.level)) siteByLevel.set(s.level, []);
      siteByLevel.get(s.level).push({ cosmetic: c, setting: s.setting ?? null, option: s.option ?? null });
    }
  }

  const levels = [];
  const created = new Map();
  const problems = [];

  for (const row of rows) {
    const { kind, pieces } = categoryToKind(row.category);
    const atLevel = siteByLevel.get(row.level) ?? [];
    const rewards = [];

    if (kind === 'unknown') {
      problems.push({ level: row.level, problem: `Categoria non riconosciuta: «${row.category}»`, row });
    } else if (kind === 'item') {
      const res = resolveReward(row.name, ctx);
      rewards.push({ nameIt: row.name, category: row.category, kind: 'item', nameEn: row.name, status: res.status, itemId: res.itemId ?? res.create?.id ?? null, quantity: res.quantity, create: res.create, notes: [] });
      if (res.status === 'unresolved') problems.push({ level: row.level, problem: `Oggetto non risolto: «${row.name}»`, row });
    } else {
      // l'outfit di una riga «toggles»/«colore» si cerca tra gli outfit, gli altri tra il loro tipo
      const searchKind = kind === 'outfit-piece' ? 'outfit' : kind;
      const candidates = cosmetics.filter((c) => c.kind === searchKind);
      const atLevelIds = new Set(atLevel.filter((s) => s.cosmetic.kind === searchKind).map((s) => s.cosmetic.id));
      const match = matchCosmetic(row.name, candidates, atLevelIds);
      if (!match) {
        problems.push({ level: row.level, problem: `Nessun cosmetico di tipo ${searchKind} corrisponde a «${row.name}»`, row });
        rewards.push({ nameIt: row.name, category: row.category, kind, status: 'unresolved', notes: ['Non riconosciuto sul sito'] });
      } else {
        const { cosmetic } = match;
        const en = cosmetic.names.en;
        const raws = kind === 'outfit-piece' ? pieces.map((p) => `${en} outfit ${p}`) : kind === 'scrappy-outfit' ? [`${en} (Scrappy)`] : [`${en} ${SUFFIX[kind]}`];
        const siteOptions = kind === 'outfit-piece'
          ? atLevel.filter((s) => s.cosmetic.id === cosmetic.id && s.option).map((s) => {
              const setting = cosmetic.settings.find((x) => x.key === s.setting);
              const option = setting?.options.find((o) => o.key === s.option);
              return { setting: s.setting, settingIt: setting?.names.it, settingEn: setting?.names.en, option: s.option, optionIt: option?.names.it, optionEn: option?.names.en };
            })
          : undefined;
        for (const raw of raws) {
          const res = resolveReward(raw, ctx);
          const notes = [];
          if (match.method !== 'name+level') notes.push(`Corrispondenza «${match.method}» (somiglianza ${match.score.toFixed(2)}): controlla il nome`);
          // Nome scritto molto diverso da quello che il sito indica a quel livello: probabile refuso nella tabella
          if (match.method === 'level-only' && match.score < 0.5 && !problems.some((p) => p.level === row.level && p.row === row)) {
            problems.push({ level: row.level, problem: `Hai scritto «${row.name}» ma a questo livello il sito indica «${cosmetic.names.it}» (${cosmetic.names.en}): controlla la riga`, row });
          }
          if (res.status === 'unresolved') problems.push({ level: row.level, problem: `Non risolto: «${raw}»`, row });
          rewards.push({
            nameIt: row.name,
            category: row.category,
            kind,
            nameEn: raw,
            cosmeticId: cosmetic.id,
            nameItSite: cosmetic.names.it,
            status: res.status,
            itemId: res.itemId ?? res.create?.id ?? null,
            quantity: res.quantity,
            create: res.create ? { ...res.create, cosmetic: res.create.cosmetic?.id, at: undefined } : undefined,
            siteOptions,
            match: { method: match.method, score: Number(match.score.toFixed(2)) },
            notes,
          });
          if (res.status === 'create') {
            const entry = created.get(res.create.id) ?? { create: res.create, levels: [] };
            entry.levels.push(row.level);
            created.set(res.create.id, entry);
          }
        }
        // Confronto con il sito: per un cosmetico (non un pezzo) deve comparire a quel livello
        if (!atLevel.some((s) => s.cosmetic.id === cosmetic.id)) {
          problems.push({ level: row.level, problem: `Il sito non indica «${cosmetic.names.en}» a questo livello del Legacy`, row });
        }
      }
    }
    levels.push({ level: row.level, source: { name: row.name, category: row.category }, rewards });
  }

  // Livelli che il sito indica ma la tabella non ha, o con un altro cosmetico
  const rowLevels = new Set(rows.map((r) => r.level));
  for (const [level, entries] of siteByLevel) {
    if (!rowLevels.has(level)) problems.push({ level, problem: `Il sito indica cosmetici a questo livello ma la tabella no: ${[...new Set(entries.map((e) => e.cosmetic.names.en))].join(', ')}` });
  }

  const customItemsNeeded = {};
  for (const [id, { create, levels: lv }] of created) {
    if (items[id] || customItems[id]) continue;
    customItemsNeeded[id] = JSON.parse(JSON.stringify(toCustomItem(create, lv)));
  }

  const summary = {
    levels: rows.length,
    rewards: levels.reduce((n, l) => n + l.rewards.length, 0),
    inCatalog: levels.flatMap((l) => l.rewards).filter((r) => r.status === 'catalog').length,
    toCreate: levels.flatMap((l) => l.rewards).filter((r) => r.status === 'create').length,
    customItemsNeeded: Object.keys(customItemsNeeded).length,
    unresolved: levels.flatMap((l) => l.rewards).filter((r) => r.status === 'unresolved').length,
    problems: problems.length,
  };

  const staging = {
    _meta: {
      id: 'legacy-pass',
      pointsPerLevel: 100,
      status: 'Dati inseriti a mano e risolti sui nomi inglesi di ARC Tracker. Non distribuito: sta in scripts/, fuori dalla build e da src/data/passes.json.',
      source: 'scripts/data/legacy-pass-source.md (estrazione a mano dall\'interfaccia italiana del gioco)',
      generatedBy: 'scripts/oneshot/import-legacy-pass.mjs',
      note: 'Ogni ricompensa ha il nome inglese ricavato dai cosmetici di ARC Tracker (che hanno nomi italiani e inglesi) e il confronto con ciò che il sito indica a quel livello (`problems`). Per toggle e colori `siteOptions` elenca i pezzi esatti secondo il sito. `customItemsNeeded` sono gli oggetti da creare se si inserisce il Legacy nei dati dell\'app.',
    },
    tracks: [{ id: 'free', name: 'Free' }],
    summary,
    levels,
    customItemsNeeded,
    problems,
  };

  if (!dry && process.argv.includes('--apply-custom-items')) {
    const nextCustom = { ...customItems, ...customItemsNeeded };
    const nextItems = { ...items };
    for (const [id, def] of Object.entries(customItemsNeeded)) nextItems[id] = toCatalogItem(def);
    const inherited = inheritPieceIcons(nextCustom, nextItems);
    writeFileSync(PATHS.customItems, JSON.stringify(nextCustom, null, 2) + '\n', 'utf-8');
    writeFileSync(PATHS.items, JSON.stringify(nextItems, null, 2) + '\n', 'utf-8');
    console.log(`Oggetti custom creati: ${Object.keys(customItemsNeeded).length} (pezzi con l'icona dell'outfit di base: ${inherited.length})`);
  }

  if (!dry && process.argv.includes('--apply-pass')) {
    const pass = {
      id: 'legacy-pass',
      name: 'Legacy Pass',
      translations: { it: { name: 'Pass Legacy' } },
      listType: 'pass',
      maxLevel: rows.length,
      tracks: [{ id: 'free', name: 'Free', translations: { it: { name: 'Gratuita' } } }],
      levels: levels.map((l) => {
        const rewards = l.rewards
          .filter((r) => r.itemId)
          .map((r) => ({ itemId: r.itemId, quantity: r.quantity ?? 1, track: 'free' }));
        return { level: l.level, requirementItemIds: [], ...(rewards.length ? { rewards } : {}) };
      }),
    };
    const existing = readJson(PATHS.passes);
    writeFileSync(PATHS.passes, JSON.stringify({ lists: [...(existing.lists ?? []).filter((p) => p.id !== pass.id), pass] }, null, 2) + '\n', 'utf-8');
    console.log(`Pass «${pass.id}» scritto in src/data/passes.json (${pass.levels.length} livelli)`);
  }

  if (!dry) {
    writeFileSync(PATHS.staging, JSON.stringify(staging, null, 2) + '\n', 'utf-8');
    mkdirSync(dirname(PATHS.report), { recursive: true });
    writeFileSync(PATHS.report, JSON.stringify({ generatedAt: new Date().toISOString(), summary, problems }, null, 2) + '\n', 'utf-8');
  }
  console.log(summary);
  if (problems.length) console.log('Da controllare:\n' + problems.map((p) => `  Lvl ${p.level}: ${p.problem}`).join('\n'));
  console.log(dry ? '(--dry-run: nessun file scritto)' : `Scritto lo staging ${PATHS.staging}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
