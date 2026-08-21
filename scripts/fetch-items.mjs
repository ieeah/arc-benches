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
    stack_size: typeof item.stat_block?.stackSize === 'number' && item.stat_block.stackSize > 0
      ? item.stat_block.stackSize : null,
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
      previousCatalogById = new Map(prev.map(i => [i.id, i]));
    } catch { /* ignore */ }
  }

  if (!refresh && existsSync(RAW_CACHE)) {
    catalog = JSON.parse(readFileSync(RAW_CACHE, 'utf-8'));
    console.log(`Using cached raw catalog (${catalog.length} items) from ${RAW_CACHE}`);
    console.log('Pass --refresh to re-fetch from MetaForge.\n');
  } else {
    console.log('Fetching full MetaForge catalog…');
    catalog = await fetchAllItems();

    // Detect upstream changes on items that have local overrides
    if (previousCatalogById && Object.keys(overrides).length > 0) {
      const diffs = [];
      for (const [id, ovr] of Object.entries(overrides)) {
        const oldItem = previousCatalogById.get(id);
        const newItem = catalog.find(i => i.id === id);
        if (!oldItem || !newItem) continue;

        for (const [key, ovrVal] of Object.entries(ovr)) {
          const oldVal = oldItem[key];
          const newVal = newItem[key];
          if (oldVal !== undefined && newVal !== undefined && String(oldVal) !== String(newVal)) {
            diffs.push({
              id,
              key,
              oldUpstream: oldVal,
              newUpstream: newVal,
              overrideVal: ovrVal,
            });
          }
        }
      }

      if (diffs.length > 0) {
        console.log('\n┌─────────────────────────────────────────────────────────────┐');
        console.log('│ ⚠️  UPSTREAM CHANGES DETECTED ON OVERRIDDEN FIELDS           │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        for (const d of diffs) {
          console.log(` • [${d.id}] "${d.key}":`);
          console.log(`     Upstream changed: "${d.oldUpstream}" -> "${d.newUpstream}"`);
          console.log(`     Local override:   "${d.overrideVal}"`);
        }
        console.log('───────────────────────────────────────────────────────────────\n');
      }
    }

    writeFileSync(RAW_CACHE, JSON.stringify(catalog, null, 2), 'utf-8');
    console.log(`\nFetched ${catalog.length} items. Cached raw source to ${RAW_CACHE}`);
  }
  console.log('Processing icons with automatic hash deduplication…\n');

  // Ordiniamo il catalogo processando prima gli oggetti base e poi i blueprint/ricette
  // in modo che il file canonico unico mantenga il nome pulito dell'oggetto base (es. wolfpack.webp)
  const sortedCatalog = [...catalog].sort((a, b) => {
    const aIsBp = a.item_type === 'Blueprint' || a.subcategory === 'Blueprint' || a.id.includes('recipe') || a.id.includes('blueprint');
    const bIsBp = b.item_type === 'Blueprint' || b.subcategory === 'Blueprint' || b.id.includes('recipe') || b.id.includes('blueprint');
    if (aIsBp !== bIsBp) return aIsBp ? 1 : -1;
    return a.id.localeCompare(b.id);
  });

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
      const dest = join(iconsDir, `${item.id}.webp`);
      const localPath = `icons/items/${item.id}.webp`; // resolved against BASE_URL at runtime
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
          // Nuova icona unica: salva su disco
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

  // Pulizia automatica dei file duplicati/orfani su disco in public/icons/items/
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
  console.log(`Icons: ${hashToCanonicalPath.size} unique saved, ${deduplicatedCount} deduplicated/shared, ${prunedCount} duplicates pruned from disk.`);
  console.log(`Workbench coverage: ${workbenchIds.size - missing.length}/${workbenchIds.size} found.`);
  console.log(`Saved to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
