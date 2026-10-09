/**
 * IMPORT UNA TANTUM del Frozen Trail Reward Pass.
 *
 * Incrocia la tabella dei livelli (scripts/data/frozen-trail-pass.json, da Polygon) con:
 *   - il nostro catalogo (src/data/items.json) → riconcilia gli oggetti già presenti;
 *   - i cosmetici di ARC Tracker (pagina /cosmetics, uso una tantum) e i suoi oggetti pubblici (/api)
 *     → crea gli oggetti mancanti come custom, con una nota «da rivedere» per ciò che non si sa.
 * Scrive:
 *   scripts/data/custom-items/items.json   oggetti custom nuovi (con `review`; già presenti: invariati)
 *   src/data/items.json                    stesse voci, come le produrrebbe fetch-items (senza `review`)
 *   src/data/passes.json                   il pass «frozen-trail» con le ricompense per livello e traccia
 *   scripts/reports/frozen-trail-import.json   rapporto completo (non versionato)
 * Non crea icone né descrizioni inventate: le voci incomplete sono segnalate nelle pagine Dev.
 *
 * Run: cd scripts && node fetch-arctracker.mjs && node oneshot/import-frozen-trail.mjs [--dry-run] [--list] [--refresh-cosmetics]
 * Con --dry-run stampa il riepilogo senza scrivere nulla.
 * Idempotente: rilanciarlo non cambia nulla se i dati di partenza sono gli stessi.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extractList, normalizeItem } from '../lib/arctracker.mjs';
import { loadCosmeticsPages, mergeLanguages, passSources } from '../lib/arctracker-cosmetics.mjs';
import { KIND_LABEL, normName, resolveReward, slug } from '../lib/pass-resolver.mjs';
import { inheritPieceIcons, toCatalogItem, toCustomItem } from '../lib/custom-item-builder.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(__dirname, '..');
const ROOT = join(SCRIPTS, '..');
const PATHS = {
  table: join(SCRIPTS, 'data', 'frozen-trail-pass.json'),
  customItems: join(SCRIPTS, 'data', 'custom-items', 'items.json'),
  atRaw: join(SCRIPTS, 'arctracker-raw.json'),
  cosmeticsRaw: join(SCRIPTS, 'arctracker-cosmetics-raw.json'),
  items: join(ROOT, 'src', 'data', 'items.json'),
  passes: join(ROOT, 'src', 'data', 'passes.json'),
  report: join(SCRIPTS, 'reports', 'frozen-trail-import.json'),
};

const readJson = (p) => JSON.parse(readFileSync(p, 'utf-8'));
const writeJson = (p, data, indent = 2) => writeFileSync(p, JSON.stringify(data, null, indent) + '\n', 'utf-8');

const PASS_DECK = 'frozen-trail-reward-pass';
const LEGACY_DECK = 'legacy-pass';

function buildContext(items, cosmetics, atItems) {
  const catalog = new Map();
  for (const [id, item] of Object.entries(items)) catalog.set(normName(item.name), id);
  const byKind = new Map();
  for (const c of cosmetics) {
    if (!c.names.en) continue;
    if (!byKind.has(c.kind)) byKind.set(c.kind, new Map());
    byKind.get(c.kind).set(normName(c.names.en), c);
  }
  const at = new Map(atItems.map((i) => [normName(i.names.en ?? i.id), i]));
  return { catalog, cosmetics: byKind, atItems: at };
}

const stripUndefined = (obj) => JSON.parse(JSON.stringify(obj));

async function main() {
  const dry = process.argv.includes('--dry-run');
  for (const needed of [PATHS.table, PATHS.atRaw]) {
    if (!existsSync(needed)) throw new Error(`Manca ${needed}: esegui prima \`node fetch-arctracker.mjs\` (e verifica la tabella del pass).`);
  }
  const table = readJson(PATHS.table);
  const items = readJson(PATHS.items);
  const customItems = readJson(PATHS.customItems);
  const atRaw = readJson(PATHS.atRaw);
  const atItems = extractList('items', atRaw.items).map(normalizeItem);
  const pages = await loadCosmeticsPages({ cachePath: PATHS.cosmeticsRaw, refresh: process.argv.includes('--refresh-cosmetics') });
  const cosmetics = mergeLanguages(pages.pages);
  const ctx = buildContext(items, cosmetics, atItems);

  // 1. risoluzione delle ricompense
  const resolutions = [];
  const created = new Map(); // id → { create, levels }
  for (const row of table.levels) {
    for (const [track, raw] of [['free', row.free], ['premium', row.premium]]) {
      if (!raw) continue;
      const res = resolveReward(raw, ctx);
      resolutions.push({ level: row.level, track, ...res, create: res.create ? { ...res.create, cosmetic: res.create.cosmetic?.id, at: res.create.at?.id } : undefined });
      if (res.status === 'create') {
        const entry = created.get(res.create.id) ?? { create: res.create, levels: [] };
        entry.levels.push(row.level);
        created.set(res.create.id, entry);
      }
      res._row = { level: row.level, track };
    }
  }
  const unresolved = resolutions.filter((r) => r.status === 'unresolved');

  // 2. oggetti custom nuovi (quelli già presenti non si toccano)
  const addedCustom = {};
  const keptCustom = [];
  for (const [id, { create, levels }] of created) {
    if (customItems[id]) { keptCustom.push(id); continue; }
    if (items[id]) { keptCustom.push(id); continue; } // già nel catalogo (es. MetaForge lo ha aggiunto)
    addedCustom[id] = stripUndefined(toCustomItem(create, levels));
  }
  const nextCustom = { ...customItems, ...addedCustom };
  const nextItems = { ...items };
  for (const [id, def] of Object.entries(addedCustom)) nextItems[id] = toCatalogItem(def);
  // I pezzi di outfit usano l'immagine dell'outfit di base (anche quelli creati da un'esecuzione precedente)
  const withInheritedIcon = inheritPieceIcons(nextCustom, nextItems);

  // 3. il pass
  const itemIdFor = (r) => (r.status === 'catalog' ? r.itemId : r.status === 'create' ? r.create.id : null);
  const levels = table.levels.map((row) => {
    const rewards = [];
    for (const track of ['free', 'premium']) {
      for (const r of resolutions.filter((x) => x.level === row.level && x.track === track)) {
        const itemId = itemIdFor(r);
        if (itemId) rewards.push({ itemId, quantity: r.quantity, track });
      }
    }
    return { level: row.level, requirementItemIds: [], ...(rewards.length ? { rewards } : {}) };
  });
  const pass = {
    id: table._meta.id,
    name: 'Frozen Trail Reward Pass',
    translations: { it: { name: 'Pass Ricompense Sentiero Gelido' } },
    listType: 'pass',
    maxLevel: table.levels.length,
    premiumCostTokens: 1150,
    tracks: [
      { id: 'free', name: 'Free', translations: { it: { name: 'Gratuita' } } },
      { id: 'premium', name: 'Premium', translations: { it: { name: 'Premium' } }, locked: true },
    ],
    levels,
  };
  const existingPasses = readJson(PATHS.passes);
  const nextPasses = { lists: [...(existingPasses.lists ?? []).filter((p) => p.id !== pass.id), pass] };

  // 4. riconciliazione di tutti i cosmetici di ARC Tracker con il nostro catalogo + indizi sul Legacy Pass
  const reconciliation = cosmetics.map((c) => {
    const label = KIND_LABEL[c.kind];
    const candidates = c.names.en ? [normName(`${c.names.en} ${label ?? c.kind}`), normName(c.names.en)] : [];
    const hit = candidates.map((n) => ctx.catalog.get(n)).find(Boolean);
    return { arctrackerId: c.id, kind: c.kind, nameEn: c.names.en, nameIt: c.names.it, catalogId: hit ?? null, addedIn: c.addedIn, release: c.release };
  });
  const legacyHints = cosmetics
    .flatMap((c) => passSources(c, LEGACY_DECK).map((s) => ({ level: s.level, premium: Boolean(s.premium), arctrackerId: c.id, kind: c.kind, nameEn: c.names.en, nameIt: c.names.it, setting: s.setting ?? null, option: s.option ?? null })))
    .sort((a, b) => a.level - b.level);
  const frozenFromSite = cosmetics.flatMap((c) => passSources(c, PASS_DECK).map((s) => ({ level: s.level, premium: Boolean(s.premium), arctrackerId: c.id, nameEn: c.names.en })));

  // 5. scrittura
  if (!dry) {
  writeJson(PATHS.customItems, nextCustom);
  writeJson(PATHS.items, nextItems);
  writeJson(PATHS.passes, nextPasses);
  mkdirSync(dirname(PATHS.report), { recursive: true });
  writeJson(PATHS.report, {
    generatedAt: new Date().toISOString(),
    sources: { table: table._meta.source, cosmeticsFetchedAt: pages.fetchedAt, arctrackerItemsGeneratedAt: atRaw.items.generatedAt },
    summary: {
      rewards: resolutions.length,
      inCatalog: resolutions.filter((r) => r.status === 'catalog').length,
      created: resolutions.filter((r) => r.status === 'create').length,
      unresolved: unresolved.length,
      customAdded: Object.keys(addedCustom).length,
      customAlreadyPresent: keptCustom.length,
      cosmeticsTotal: cosmetics.length,
      cosmeticsInCatalog: reconciliation.filter((r) => r.catalogId).length,
      legacyHintEntries: legacyHints.length,
    },
    unresolved: unresolved.map(({ level, track, raw }) => ({ level, track, raw })),
    resolutions,
    addedCustom: Object.keys(addedCustom),
    reconciliation,
    frozenTrailFromSite: frozenFromSite,
    legacyPassHints: legacyHints,
  });
  }

  const s = resolutions;
  console.log(`Ricompense: ${s.length} · nel catalogo: ${s.filter((r) => r.status === 'catalog').length} · da creare: ${s.filter((r) => r.status === 'create').length} · non risolte: ${unresolved.length}`);
  console.log(`Oggetti custom aggiunti: ${Object.keys(addedCustom).length} (già presenti: ${keptCustom.length}) · pezzi che ereditano l'icona dell'outfit: ${withInheritedIcon.length}`);
  if (process.argv.includes('--list')) for (const [id, def] of Object.entries(addedCustom)) console.log(`  + ${id} | ${def.name} | ${def.item_type}/${def.subcategory || '-'} | ${def.translations?.it?.name ?? '—'}`);
  if (unresolved.length) console.log('Non risolte:', unresolved.map((u) => `Lvl ${u.level} ${u.track}: ${u.raw}`));
  console.log(`Cosmetici ARC Tracker nel nostro catalogo: ${reconciliation.filter((r) => r.catalogId).length}/${cosmetics.length}`);
  console.log(dry ? '(--dry-run: nessun file scritto)' : `Scritti: ${PATHS.customItems}, ${PATHS.items}, ${PATHS.passes}, ${PATHS.report}`);
  void slug;
}

main().catch((e) => { console.error(e); process.exit(1); });
