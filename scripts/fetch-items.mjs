/**
 * Fetch item data from MetaForge for all items referenced in workbenches.json.
 * Run with: node scripts/fetch-items.mjs
 * Output: src/data/items.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

async function main() {
  const workbenches = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'workbenches.json'), 'utf-8'));
  const ids = parseItemIds(workbenches);

  console.log(`Found ${ids.length} items to fetch:\n  ${ids.join(', ')}\n`);

  const results = {};
  let ok = 0;
  let missing = 0;

  for (const id of ids) {
    process.stdout.write(`Fetching ${id}... `);
    try {
      const item = await fetchItem(id);
      if (item) {
        results[id] = {
          id: item.id,
          name: item.name,
          description: item.description,
          icon: item.icon,
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
