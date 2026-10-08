/**
 * Fetch the FULL item catalog from MetaForge (all items, paginated), not just the ones
 * referenced by workbenches. Custom lists need an item picker over the whole catalog.
 * Icons are downloaded locally (the MetaForge CDN blocks hotlinking on some devices).
 *
 * This folder is its own package (sharp must NOT be a dependency of the main app:
 * its platform bindings destabilize the root lockfile for CI).
 * Run with: cd scripts && npm install && node fetch-items.mjs
 * Output: src/data/items.json + public/icons/items/*.webp
 *
 * The full UNTRIMMED catalog is cached to scripts/metaforge-raw.json (gitignored): it keeps
 * every field MetaForge returns (full stat_block, sources, locations, …) so we can surface more
 * data later without re-fetching. Re-runs reuse this cache and skip already-downloaded icons.
 * Pass --refresh to force a network re-fetch; delete public/icons/items to re-download icons.
 *
 * Items that don't exist upstream (reward currencies such as Reward Points / XP Points) live in
 * scripts/data/custom-items/ (items.json + source icons) and are appended to the catalog.
 *
 * Every run also writes src/data/overrides-conflicts.json: the list of local overrides that need
 * a manual review (upstream changed, override now redundant, item gone upstream). The Overrides
 * Studio (DevOverridesPage) reads it to let you resolve them one by one or in bulk.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PAGE_SIZE = 100; // MetaForge caps limit at 100
const RAW_CACHE = join(__dirname, 'metaforge-raw.json'); // full untrimmed source (gitignored)

// Collect every itemId used in workbench level requirements (for a coverage sanity check)
function parseWorkbenchItemIds(workbenches) {
  const ids = new Set();
  workbenches.items.forEach(wb =>
    wb.levels.forEach(lvl =>
      lvl.requirementItemIds.forEach(req => ids.add(req.itemId))
    )
  );
  return ids;
}

// Fetch one page of the catalog
async function fetchPage(page) {
  const url = `https://metaforge.app/api/arc-raiders/items?page=${page}&limit=${PAGE_SIZE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for page ${page}`);
  return res.json();
}

// Walk every page until hasNextPage is false
async function fetchAllItems() {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const json = await fetchPage(page);
    all.push(...(json.data ?? []));
    totalPages = json.pagination?.totalPages ?? page;
    process.stdout.write(`  page ${page}/${totalPages} (${json.data?.length ?? 0} items)\n`);
    page++;
    await new Promise(r => setTimeout(r, 150)); // be kind to the API
  } while (page <= totalPages);
  return all;
}

// Largest in-app rendering is 160px (detail sheet): 256px covers 2x retina
async function processIconBuffer(originalBuffer) {
  // 1. Trim transparent borders & scale inside 216x216
  const trimmed = await sharp(originalBuffer)
    .trim()
    .resize(216, 216, { fit: 'inside', withoutEnlargement: false })
    .toBuffer();

  // 2. Composite onto centered 256x256 canvas with clean transparent background
  const normalized = await sharp(trimmed)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80, effort: 4, smartSubsample: true })
    .toBuffer();

  return normalized;
}

function deriveStackSize(item) {
  return typeof item.stat_block?.stackSize === 'number' && item.stat_block.stackSize > 0
    ? item.stat_block.stackSize : null;
}

// MetaForge marks some non-blueprint items with a '-recipe' suffix (rubber-parts-recipe, wires-recipe…)
function normalizeItemId(item) {
  const isBp = item.item_type === 'Blueprint' || item.subcategory === 'Blueprint';
  return !isBp && item.id.endsWith('-recipe') ? item.id.replace(/-recipe$/, '') : item.id;
}

const CONFLICTS_PATH = join(ROOT, 'src', 'data', 'overrides-conflicts.json');
// Override fields that mirror an upstream (MetaForge) value and can therefore be compared with it
const COMPARABLE_KEYS = ['name', 'description', 'rarity', 'item_type', 'subcategory', 'value', 'workbench', 'loot_area', 'stack_size'];

function upstreamValue(item, key) {
  return key === 'stack_size' ? deriveStackSize(item) : (item[key] ?? null);
}

// null / undefined / '' are the same "no value" for comparison purposes
function comparable(v) {
  return v === undefined || v === null || v === '' ? null : String(v);
}

/**
 * Classifies the overrides that need a manual review:
 *  - changed:   upstream changed since the previous --refresh and differs from the override
 *  - redundant: the override now equals the upstream value (safe to drop)
 *  - orphan:    the overridden item no longer exists upstream
 * `changed` needs the previous raw catalog, so it is persisted across runs (until the upstream
 * value moves again or the override is removed); redundant/orphan are recomputed every time.
 */
function detectOverrideConflicts({ overrides, catalog, previousById, previousConflicts }) {
  const today = new Date().toISOString().slice(0, 10);
  const byId = new Map(catalog.map(i => [i.id, i]));
  const conflicts = [];
  const seenSince = (c) => previousConflicts.find(p =>
    p.id === c.id && p.key === c.key && p.kind === c.kind &&
    comparable(p.newUpstream) === comparable(c.newUpstream))?.detectedAt;

  for (const [id, ovr] of Object.entries(overrides)) {
    const item = byId.get(id);
    if (!item) {
      conflicts.push({ id, key: '*', kind: 'orphan', oldUpstream: null, newUpstream: null, overrideVal: Object.keys(ovr) });
      continue;
    }
    for (const key of COMPARABLE_KEYS) {
      if (!(key in ovr)) continue;
      const current = upstreamValue(item, key);
      if (comparable(current) === comparable(ovr[key])) {
        conflicts.push({ id, key, kind: 'redundant', oldUpstream: null, newUpstream: current, overrideVal: ovr[key] });
        continue;
      }
      const prev = previousById?.get(id);
      if (prev && comparable(upstreamValue(prev, key)) !== comparable(current)) {
        conflicts.push({ id, key, kind: 'changed', oldUpstream: upstreamValue(prev, key), newUpstream: current, overrideVal: ovr[key] });
      }
    }
  }

  // Keep unresolved `changed` entries from earlier runs while the upstream value hasn't moved
  for (const p of previousConflicts) {
    if (p.kind !== 'changed' || conflicts.some(c => c.id === p.id && c.key === p.key)) continue;
    const item = byId.get(p.id);
    if (!item || !(p.key in (overrides[p.id] ?? {}))) continue;
    if (comparable(upstreamValue(item, p.key)) === comparable(p.newUpstream)) conflicts.push(p);
  }

  return conflicts
    .map(c => ({ ...c, detectedAt: seenSince(c) ?? c.detectedAt ?? today }))
    .sort((a, b) => a.id.localeCompare(b.id) || a.key.localeCompare(b.key));
}

function trimItem(item, icon, itemOverride = {}) {
  const base = {
    id: item.id,
    name: item.name,
    description: item.description,
    icon,
    rarity: item.rarity,
    item_type: item.item_type,
    subcategory: item.subcategory,
    value: item.value,
    workbench: item.workbench,
    loot_area: item.loot_area,
    stack_size: deriveStackSize(item),
  };

  return {
    ...base,
    ...itemOverride,
    id: item.id,
    icon: itemOverride.icon !== undefined ? itemOverride.icon : icon,
  };
}

async function main() {
  const workbenches = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'workbenches.json'), 'utf-8'));
  const workbenchIds = parseWorkbenchItemIds(workbenches);
  const iconsDir = join(ROOT, 'public', 'icons', 'items');
  mkdirSync(iconsDir, { recursive: true });

  const overridesPath = join(ROOT, 'src', 'data', 'items-overrides.json');
  let overrides = {};
  if (existsSync(overridesPath)) {
    try {
      overrides = JSON.parse(readFileSync(overridesPath, 'utf-8'));
      const overrideCount = Object.keys(overrides).length;
      if (overrideCount > 0) {
        console.log(`Loaded ${overrideCount} item overrides from src/data/items-overrides.json`);
      }
    } catch (err) {
      console.warn(`⚠ Failed to parse ${overridesPath}: ${err.message}`);
    }
  }

  // Reuse the raw cache unless --refresh or it's missing
  const refresh = process.argv.includes('--refresh');
  let catalog;
  let previousCatalogById = null;

  if (existsSync(RAW_CACHE)) {
    try {
      const prev = JSON.parse(readFileSync(RAW_CACHE, 'utf-8'));
      previousCatalogById = new Map(prev.map(i => [normalizeItemId(i), i]));
    } catch { /* ignore */ }
  }

  if (!refresh && existsSync(RAW_CACHE)) {
    catalog = JSON.parse(readFileSync(RAW_CACHE, 'utf-8'));
    console.log(`Using cached raw catalog (${catalog.length} items) from ${RAW_CACHE}`);
    console.log('Pass --refresh to re-fetch from MetaForge.\n');
  } else {
    console.log('Fetching full MetaForge catalog…');
    catalog = await fetchAllItems();

    writeFileSync(RAW_CACHE, JSON.stringify(catalog, null, 2), 'utf-8');
    console.log(`\nFetched ${catalog.length} items. Cached raw source to ${RAW_CACHE}`);
  }
  // Normalizza gli ID per quegli oggetti che MetaForge marca erroneamente con suffisso '-recipe'
  // pur non essendo blueprint (es. rubber-parts-recipe, wires-recipe, sensors-recipe, duct-tape-recipe)
  for (const item of catalog) item.id = normalizeItemId(item);

  // Overrides da rivedere (upstream cambiato / ridondanti / orfani) -> letti dalla DevOverridesPage
  let previousConflicts = [];
  try {
    if (existsSync(CONFLICTS_PATH)) previousConflicts = JSON.parse(readFileSync(CONFLICTS_PATH, 'utf-8')).conflicts ?? [];
  } catch { /* ignore */ }
  const conflicts = detectOverrideConflicts({
    overrides,
    catalog,
    previousById: refresh ? previousCatalogById : null,
    previousConflicts,
  });
  writeFileSync(CONFLICTS_PATH, JSON.stringify({ conflicts }, null, 2) + '\n', 'utf-8');
  if (conflicts.length > 0) {
    const count = kind => conflicts.filter(c => c.kind === kind).length;
    console.log(`\n⚠️  Overrides da rivedere: ${count('changed')} upstream cambiato, ${count('redundant')} ridondanti, ${count('orphan')} orfani`);
    console.log('   Risolvili dal filtro "Conflitti upstream" in DevOverridesPage (src/data/overrides-conflicts.json)\n');
  }

  // Ordiniamo il catalogo processando prima gli oggetti base e poi i blueprint/ricette
  // in modo che il file canonico unico mantenga il nome pulito dell'oggetto base (es. wolfpack.webp, anvil.webp)
  const sortedCatalog = [...catalog].sort((a, b) => {
    const aIsBp = a.item_type === 'Blueprint' || a.subcategory === 'Blueprint' || a.id.includes('recipe') || a.id.includes('blueprint');
    const bIsBp = b.item_type === 'Blueprint' || b.subcategory === 'Blueprint' || b.id.includes('recipe') || b.id.includes('blueprint');
    if (aIsBp !== bIsBp) return aIsBp ? 1 : -1;
    return a.id.localeCompare(b.id);
  });

  const getCanonicalIconId = (id) => {
    return id.replace(/-recipe$/, '').replace(/-blueprint$/, '');
  };

  const results = {};
  const hashToCanonicalPath = new Map();
  const usedIconPaths = new Set();
  let withIcon = 0;
  let skipped = 0;
  let iconFailed = 0;
  let overriddenCount = 0;
  let hiddenCount = 0;
  let deduplicatedCount = 0;

  for (const item of sortedCatalog) {
    const itemOverride = overrides[item.id] || null;
    
    // Se l'oggetto è contrassegnato come hidden, non viene inserito nel JSON dell'app
    if (itemOverride?.hidden) {
      hiddenCount++;
      continue;
    }

    let icon = null;
    if (item.icon) {
      const canonicalIconId = getCanonicalIconId(item.id);
      const dest = join(iconsDir, `${canonicalIconId}.webp`);
      const localPath = `icons/items/${canonicalIconId}.webp`; // resolved against BASE_URL at runtime
      try {
        let normalizedBuf;
        if (existsSync(dest)) {
          normalizedBuf = readFileSync(dest);
          skipped++;
        } else {
          const res = await fetch(item.icon);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const rawBuf = Buffer.from(await res.arrayBuffer());
          normalizedBuf = await processIconBuffer(rawBuf);
          withIcon++;
          await new Promise(r => setTimeout(r, 60));
        }

        // Calcolo hash MD5 del buffer normalizzato per deduplicazione
        const hash = crypto.createHash('md5').update(normalizedBuf).digest('hex');

        if (hashToCanonicalPath.has(hash)) {
          // Riuso il percorso canonico già salvato (stessa identica immagine)
          icon = hashToCanonicalPath.get(hash);
          deduplicatedCount++;
        } else {
          // Nuova icona unica: salva su disco col nome canonico pulito (senza -recipe)
          if (!existsSync(dest)) {
            writeFileSync(dest, normalizedBuf);
          }
          icon = localPath;
          hashToCanonicalPath.set(hash, localPath);
        }
        usedIconPaths.add(icon);
      } catch (e) {
        console.log(`  icon failed for ${item.id}: ${e.message}`);
        iconFailed++;
      }
    }
    if (itemOverride) overriddenCount++;
    results[item.id] = trimItem(item, icon, itemOverride || {});
  }

  // Oggetti custom, assenti da MetaForge (valute di ricompensa): definizione + icona sorgente
  // in scripts/data/custom-items/. L'icona viene normalizzata come le altre e protetta dalla pulizia.
  const customDir = join(__dirname, 'data', 'custom-items');
  const customItems = JSON.parse(readFileSync(join(customDir, 'items.json'), 'utf-8'));
  for (const [id, def] of Object.entries(customItems)) {
    if (results[id]) {
      console.warn(`⚠ Custom item "${id}" ignored: the id already exists in the MetaForge catalog`);
      continue;
    }
    // Senza icona sorgente l'icona resta null: l'app ripiega su sottocategoria > categoria > fallback
    let localPath = null;
    const sourceIcon = def.icon ? join(customDir, def.icon) : null;
    if (sourceIcon && existsSync(sourceIcon)) {
      localPath = `icons/items/${id}.webp`;
      writeFileSync(join(iconsDir, `${id}.webp`), await processIconBuffer(readFileSync(sourceIcon)));
      usedIconPaths.add(localPath);
    } else if (def.icon) {
      console.warn(`⚠ Custom item "${id}": icon source "${def.icon}" not found, falling back to the category icon`);
    }
    results[id] = { ...def, ...(overrides[id] ?? {}), id, icon: localPath };
  }

  // Pulizia automatica dei file duplicati/orfani su disco in public/icons/items/ (inclusi i vecchi *-recipe.webp)
  const diskFiles = readdirSync(iconsDir).filter(f => f.endsWith('.webp') || f.endsWith('.png'));
  let prunedCount = 0;
  for (const file of diskFiles) {
    const relPath = `icons/items/${file}`;
    if (!usedIconPaths.has(relPath)) {
      unlinkSync(join(iconsDir, file));
      prunedCount++;
    }
  }

  // Coverage sanity check: every workbench requirement must exist in the catalog
  const missing = [...workbenchIds].filter(id => !results[id]);
  if (missing.length) {
    console.log(`\n⚠ ${missing.length} workbench item(s) NOT in catalog: ${missing.join(', ')}`);
  }

  const outPath = join(ROOT, 'src', 'data', 'items.json');
  writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\nDone. ${catalog.length} items (${overriddenCount} with overrides, ${hiddenCount} hidden).`);
  console.log(`Icons: ${hashToCanonicalPath.size} unique saved, ${deduplicatedCount} deduplicated/shared, ${prunedCount} duplicates/orphans pruned from disk.`);
  console.log(`Workbench coverage: ${workbenchIds.size - missing.length}/${workbenchIds.size} found.`);
  console.log(`Saved to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
