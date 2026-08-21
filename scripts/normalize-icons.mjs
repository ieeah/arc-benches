import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'public', 'icons', 'items');
const DEST_DIR = join(ROOT, 'public', 'icons', 'items_trimmed');

if (!existsSync(DEST_DIR)) {
  mkdirSync(DEST_DIR, { recursive: true });
}

async function processFile(file) {
  const srcPath = join(SRC_DIR, file);
  const destPath = join(DEST_DIR, file);

  try {
    const trimmedBuffer = await sharp(srcPath)
      .trim()
      .resize(216, 216, {
        fit: 'inside',
        withoutEnlargement: false,
      })
      .toBuffer();

    await sharp(trimmedBuffer)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 80, effort: 3, smartSubsample: true })
      .toFile(destPath);
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}

async function normalizeIcons() {
  const files = readdirSync(SRC_DIR).filter(f => f.endsWith('.webp') || f.endsWith('.png'));
  console.log(`Normalizing ${files.length} icons in parallel to public/icons/items_trimmed...`);

  const CONCURRENCY = 16;
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processFile));
    if ((i + CONCURRENCY) % 100 === 0 || i + CONCURRENCY >= files.length) {
      console.log(`  Processed ${Math.min(i + CONCURRENCY, files.length)}/${files.length} icons`);
    }
  }

  console.log(`Done! ${files.length} icons normalized in public/icons/items_trimmed`);
}

normalizeIcons().catch(console.error);
