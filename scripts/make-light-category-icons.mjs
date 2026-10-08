/**
 * Genera le varianti per tema chiaro delle icone di categoria (public/icons/categories/light/*.webp).
 * Le icone sorgente sono chiare (pensate per sfondo scuro): in tema chiaro erano invertite via CSS
 * (`filter: invert`), ora l'app carica direttamente la variante giusta, senza filtri per card e
 * scaricando solo la serie del tema corrente.
 * Run: cd scripts && node make-light-category-icons.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons', 'categories');
const OUT = join(SRC, 'light');
mkdirSync(OUT, { recursive: true });

for (const file of readdirSync(SRC).filter(f => f.endsWith('.webp'))) {
  const buf = await sharp(readFileSync(join(SRC, file)))
    .negate({ alpha: false })
    .webp({ quality: 85, effort: 4, smartSubsample: true })
    .toBuffer();
  writeFileSync(join(OUT, file), buf);
  console.log(`light/${file}`);
}
