/**
 * Fetch item data from MetaForge for all items referenced in workbenches.json.
 * Icons are downloaded locally (the MetaForge CDN blocks hotlinking on some devices).
 *
 * This folder is its own package (sharp must NOT be a dependency of the main app:
 * its platform bindings destabilize the root lockfile for CI).
 * Run with: cd scripts && npm install && node fetch-items.mjs
 * Output: src/data/items.json + public/icons/items/*.webp
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Collect every itemId used in workbench level requirements
function parseItemIds(workbenches) {
  const ids = new Set();
  workbenches.items.forEach(wb =>
    wb.levels.forEach(lvl =>
      lvl.requirementItemIds.forEach(req => ids.add(req.itemId))
    )
  );
  return [...ids];
}

async function fetchItem(id) {
  const url = `https://metaforge.app/api/arc-raiders/items?id=${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${id}`);
  const json = await res.json();
  return json.data?.[0] ?? null;
}

// Largest in-app rendering is 160px (detail sheet): 256px covers 2x retina
async function downloadIcon(remoteUrl, destPath) {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} for icon`);
  const original = Buffer.from(await res.arrayBuffer());
  const resized = await sharp(original)
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  writeFileSync(destPath, resized);
}

async function main() {
  const workbenches = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'workbenches.json'), 'utf-8'));
  const ids = parseItemIds(workbenches);
  const iconsDir = join(ROOT, 'public', 'icons', 'items');
  mkdirSync(iconsDir, { recursive: true });

  console.log(`Found ${ids.length} items to fetch:\n  ${ids.join(', ')}\n`);

  const results = {};
  let ok = 0;
  let missing = 0;

  for (const id of ids) {
    process.stdout.write(`Fetching ${id}... `);
    try {
      const item = await fetchItem(id);
      if (item) {
        let icon = null;
        if (item.icon) {
          try {
            await downloadIcon(item.icon, join(iconsDir, `${id}.webp`));
            icon = `icons/items/${id}.webp`; // local path, resolved against BASE_URL at runtime
          } catch (e) {
            console.log(`(icon failed: ${e.message}) `);
          }
        }
        results[id] = {
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
        };
        console.log(`✓ ${item.name} (${item.rarity})`);
        ok++;
      } else {
        console.log(`✗ not found`);
        missing++;
      }
    } catch (e) {
      console.log(`✗ error: ${e.message}`);
      missing++;
    }
    // Small delay to be kind to the API
    await new Promise(r => setTimeout(r, 150));
  }

  mkdirSync(join(ROOT, 'src', 'data'), { recursive: true });
  const outPath = join(ROOT, 'src', 'data', 'items.json');
  writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\nDone. ${ok} fetched, ${missing} missing.`);
  console.log(`Saved to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
