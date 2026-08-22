/**
 * Fetch category icons from ARC Raiders Wiki (MediaWiki API),
 * normalize transparent bounding boxes and save optimized WebP icons.
 *
 * Usage:
 *   cd scripts && npm install && node fetch-category-icons.mjs
 * Output:
 *   public/icons/categories/*.webp
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'icons', 'categories');

const WIKI_API_URL = 'https://arcraiders.wiki/w/api.php?action=query&generator=categorymembers&gcmtitle=Category:Item_category_icons&gcmlimit=50&prop=imageinfo&iiprop=url|size|mime&format=json';

// Normalize filename: "File:Icon WeaponMod.png" -> "weapon-mod"
function slugifyFileName(title) {
  let clean = title.replace(/^File:Icon\s+/, '').replace(/^File:/, '').replace(/\.[^.]+$/, '');
  return clean
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

async function processIconBuffer(originalBuffer) {
  // 1. Trim transparent borders & scale inside 216x216
  const trimmed = await sharp(originalBuffer)
    .trim()
    .resize(216, 216, { fit: 'inside', withoutEnlargement: false })
    .toBuffer();

  // 2. Composite onto centered 256x256 canvas with clean transparent background
  const normalized = await sharp(trimmed)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 85, effort: 4, smartSubsample: true })
    .toBuffer();

  return normalized;
}

async function main() {
  console.log('Fetching Category Icons from ARC Raiders Wiki API...');
  mkdirSync(OUT_DIR, { recursive: true });

  const res = await fetch(WIKI_API_URL, {
    headers: {
      'User-Agent': 'ARCBenchesCompanion/1.0 (https://github.com/ieeah/arc-benches)',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to query Wiki API: HTTP ${res.status}`);
  }

  const json = await res.json();
  const pages = Object.values(json.query?.pages ?? {});

  console.log(`Found ${pages.length} category icons in Category:Item category icons.`);

  const manifest = {};

  for (const page of pages) {
    const title = page.title;
    const info = page.imageinfo?.[0];
    if (!info?.url) {
      console.warn(`Skipping ${title}: no image URL found`);
      continue;
    }

    const slug = slugifyFileName(title);
    const destPath = join(OUT_DIR, `${slug}.webp`);
    console.log(`  Downloading ${title} -> ${slug}.webp...`);

    const imgRes = await fetch(info.url, {
      headers: {
        'User-Agent': 'ARCBenchesCompanion/1.0 (https://github.com/ieeah/arc-benches)',
      },
    });

    if (!imgRes.ok) {
      console.error(`  Failed to download ${info.url}: HTTP ${imgRes.status}`);
      continue;
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    const optimized = await processIconBuffer(originalBuffer);
    writeFileSync(destPath, optimized);

    manifest[slug] = {
      title,
      wikiUrl: info.url,
      localPath: `/arc-benches/icons/categories/${slug}.webp`,
    };
  }

  console.log(`\nSuccessfully saved ${Object.keys(manifest).length} icons to public/icons/categories/`);
}

main().catch(err => {
  console.error('Error fetching category icons:', err);
  process.exit(1);
});
