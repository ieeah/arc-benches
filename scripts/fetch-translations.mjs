/**
 * Fetch official multi-language item translations from RaidTheory/arcraiders-data
 * (datamined from game localization files / .locres tables).
 *
 * Usage:
 *   cd scripts && node fetch-translations.mjs [--refresh] [--lang=it]
 *
 * Output:
 *   Updates src/data/items.json with translations (e.g. translations.it)
 *   Caches raw data in scripts/translations-raw.json (gitignored)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_CACHE = join(__dirname, "translations-raw.json");
const ITEMS_JSON = join(ROOT, "src", "data", "items.json");
const OVERRIDES_JSON = join(ROOT, "src", "data", "items-overrides.json");

const GITHUB_TREE_API = "https://api.github.com/repos/RaidTheory/arcraiders-data/git/trees/main?recursive=1";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main/";

async function fetchRawTranslations() {
  console.log("Fetching item file list from RaidTheory/arcraiders-data...");
  const treeRes = await fetch(GITHUB_TREE_API, {
    headers: { "User-Agent": "ARCBenchesCompanion/1.0" },
  });
  if (!treeRes.ok) {
    throw new Error(`Failed to fetch repo tree from GitHub API: HTTP ${treeRes.status}`);
  }
  const tree = await treeRes.json();
  const itemNodes = (tree.tree || []).filter(
    (n) => n.path.startsWith("items/") && n.path.endsWith(".json")
  );

  console.log(`Found ${itemNodes.length} item files. Downloading in parallel...`);

  const results = {};
  const chunkSize = 40;
  for (let i = 0; i < itemNodes.length; i += chunkSize) {
    const chunk = itemNodes.slice(i, i + chunkSize);
    const promises = chunk.map(async (node) => {
      try {
        const res = await fetch(`${GITHUB_RAW_BASE}${node.path}`);
        if (!res.ok) return null;
        const json = await res.json();
        return json;
      } catch {
        return null;
      }
    });

    const chunkResults = await Promise.all(promises);
    for (const item of chunkResults) {
      if (item && item.id) {
        results[item.id] = item;
      }
    }
    process.stdout.write(`  progress: ${Math.min(i + chunkSize, itemNodes.length)}/${itemNodes.length} items\r`);
  }
  console.log(`\nDownloaded ${Object.keys(results).length} item definitions successfully.`);

  return results;
}

function normalizeKey(str) {
  return (str || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findBestMatch(ourItem, raidTheoryItems) {
  const ourId = ourItem.id;
  const ourHyphenId = ourId.toLowerCase();
  const ourUnderscoreId = ourId.replace(/-/g, "_").toLowerCase();

  // 1. Direct ID matches
  if (raidTheoryItems[ourUnderscoreId]) return raidTheoryItems[ourUnderscoreId];
  if (raidTheoryItems[ourHyphenId]) return raidTheoryItems[ourHyphenId];

  // 2. Blueprint / Recipe suffix variations
  const blueprintVariations = [
    ourUnderscoreId.replace(/_recipe$/, "_blueprint"),
    ourUnderscoreId.replace(/_blueprint$/, "_recipe"),
    ourUnderscoreId.replace(/-recipe$/, "-blueprint"),
    ourUnderscoreId.replace(/-blueprint$/, "-recipe"),
    ourUnderscoreId.replace(/_recipe$/, ""),
    ourUnderscoreId.replace(/_blueprint$/, ""),
  ];
  for (const alt of blueprintVariations) {
    if (raidTheoryItems[alt]) return raidTheoryItems[alt];
  }

  // 3. Roman numerals to Arabic numbers or vice-versa
  const numeralReplacements = [
    [/-i$/, "-1"], [/_i$/, "_1"],
    [/-ii$/, "-2"], [/_ii$/, "_2"],
    [/-iii$/, "-3"], [/_iii$/, "_3"],
    [/-iv$/, "-4"], [/_iv$/, "_4"],
    [/-1$/, "-i"], [/_1$/, "_i"],
    [/-2$/, "-ii"], [/_2$/, "_ii"],
    [/-3$/, "-iii"], [/_3$/, "_iii"],
    [/-4$/, "-iv"], [/_4$/, "_iv"],
  ];
  for (const [pattern, rep] of numeralReplacements) {
    const alt = ourUnderscoreId.replace(pattern, rep);
    if (raidTheoryItems[alt]) return raidTheoryItems[alt];
  }

  // 4. Match by English name
  const ourNormName = normalizeKey(ourItem.name);
  for (const r of Object.values(raidTheoryItems)) {
    if (r.name && r.name.en && normalizeKey(r.name.en) === ourNormName) {
      return r;
    }
  }

  return null;
}

async function main() {
  const refresh = process.argv.includes("--refresh");
  const targetLang = (process.argv.find((a) => a.startsWith("--lang="))?.split("=")[1]) || "it";

  console.log(`=== ARC Benches - Translation Synchronizer [${targetLang.toUpperCase()}] ===`);

  let raidTheoryItems;
  if (!refresh && existsSync(RAW_CACHE)) {
    console.log(`Using cached raw translations from ${RAW_CACHE}`);
    console.log("Pass --refresh to re-fetch from GitHub repository.\n");
    raidTheoryItems = JSON.parse(readFileSync(RAW_CACHE, "utf-8"));
  } else {
    raidTheoryItems = await fetchRawTranslations();
    writeFileSync(RAW_CACHE, JSON.stringify(raidTheoryItems, null, 2), "utf-8");
    console.log(`Cached raw translations to ${RAW_CACHE}\n`);
  }

  if (!existsSync(ITEMS_JSON)) {
    throw new Error(`Items database not found at ${ITEMS_JSON}`);
  }

  const itemsData = JSON.parse(readFileSync(ITEMS_JSON, "utf-8"));
  let overrides = {};
  if (existsSync(OVERRIDES_JSON)) {
    try {
      overrides = JSON.parse(readFileSync(OVERRIDES_JSON, "utf-8"));
    } catch (e) {
      console.warn(`Warning: could not parse overrides: ${e.message}`);
    }
  }

  let totalItems = 0;
  let translatedCount = 0;
  let overriddenCount = 0;
  const unmatched = [];

  for (const [id, item] of Object.entries(itemsData)) {
    totalItems++;
    const match = findBestMatch(item, raidTheoryItems);

    let itName = match?.name?.[targetLang];
    let itDesc = match?.description?.[targetLang];

    // Check if local override exists for translations
    const itemOverride = overrides[id];
    const overrideTrans = itemOverride?.translations?.[targetLang];
    if (overrideTrans) {
      overriddenCount++;
      if (overrideTrans.name) itName = overrideTrans.name;
      if (overrideTrans.description) itDesc = overrideTrans.description;
    }

    if (itName || itDesc) {
      translatedCount++;
      item.translations = item.translations || {};
      item.translations[targetLang] = {
        name: itName || item.name,
        description: itDesc !== undefined ? itDesc : (item.description || ""),
      };
    } else {
      unmatched.push({ id: item.id, name: item.name });
    }
  }

  writeFileSync(ITEMS_JSON, JSON.stringify(itemsData, null, 2) + "\n", "utf-8");

  console.log("┌─────────────────────────────────────────────────────────────┐");
  console.log("│                   TRANSLATION SYNC REPORT                   │");
  console.log("├─────────────────────────────────────────────────────────────┤");
  console.log(`│ Total items in database:        ${String(totalItems).padStart(6)}                      │`);
  console.log(`│ Items localized in ${targetLang.toUpperCase()}:           ${String(translatedCount).padStart(6)} (${Math.round((translatedCount / totalItems) * 100)}%)               │`);
  console.log(`│ Local overrides preserved:      ${String(overriddenCount).padStart(6)}                      │`);
  console.log(`│ Unmatched items (fallback EN):  ${String(unmatched.length).padStart(6)}                      │`);
  console.log("└─────────────────────────────────────────────────────────────┘");

  if (unmatched.length > 0) {
    console.log(`\nUnmatched items (${unmatched.length}):`);
    for (const u of unmatched.slice(0, 15)) {
      console.log(` • [${u.id}] "${u.name}"`);
    }
    if (unmatched.length > 15) {
      console.log(`   ... and ${unmatched.length - 15} more (mostly cosmetics/outfits).`);
    }
  }

  console.log(`\nSaved updated translations to ${ITEMS_JSON}\n`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
