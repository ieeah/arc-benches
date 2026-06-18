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

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
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
async function downloadIcon(remoteUrl, destPath) {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} for icon`);
  const original = Buffer.from(await res.arrayBuffer());
  const resized = await sharp(original)
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    // 256px = 2x retina for the largest render (160px detail sheet). effort:6 = max compression
    // (slower encode, no quality cost); q74 is visually indistinguishable at these UI sizes.
    .webp({ quality: 74, effort: 6, smartSubsample: true })
    .toBuffer();
  writeFileSync(destPath, resized);
}

function trimItem(item, icon) {
  return {
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
}

async function main() {
  const workbenches = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'workbenches.json'), 'utf-8'));
  const workbenchIds = parseWorkbenchItemIds(workbenches);
  const iconsDir = join(ROOT, 'public', 'icons', 'items');
  mkdirSync(iconsDir, { recursive: true });

  // Reuse the raw cache unless --refresh or it's missing
  const refresh = process.argv.includes('--refresh');
  let catalog;
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
  console.log('Processing icons…\n');

  const results = {};
  let withIcon = 0;
  let skipped = 0;
  let iconFailed = 0;

  for (const item of catalog) {
    let icon = null;
    if (item.icon) {
      const dest = join(iconsDir, `${item.id}.webp`);
      const localPath = `icons/items/${item.id}.webp`; // resolved against BASE_URL at runtime
      if (existsSync(dest)) {
        icon = localPath;
        skipped++;
      } else {
        try {
          await downloadIcon(item.icon, dest);
          icon = localPath;
          withIcon++;
          await new Promise(r => setTimeout(r, 80));
        } catch (e) {
          console.log(`  icon failed for ${item.id}: ${e.message}`);
          iconFailed++;
        }
      }
    }
    results[item.id] = trimItem(item, icon);
  }

  // Coverage sanity check: every workbench requirement must exist in the catalog
  const missing = [...workbenchIds].filter(id => !results[id]);
  if (missing.length) {
    console.log(`\n⚠ ${missing.length} workbench item(s) NOT in catalog: ${missing.join(', ')}`);
  }

  const outPath = join(ROOT, 'src', 'data', 'items.json');
  writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\nDone. ${catalog.length} items, ${withIcon} icons downloaded, ${skipped} reused, ${iconFailed} failed.`);
  console.log(`Workbench coverage: ${workbenchIds.size - missing.length}/${workbenchIds.size} found.`);
  console.log(`Saved to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
