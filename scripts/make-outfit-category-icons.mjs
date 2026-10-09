/**
 * Genera le icone di sottocategoria PROVVISORIE degli outfit sbloccati a pezzi:
 *   outfit.webp          completo di base   (tipo Outfits, sottocategoria "Outfit")
 *   outfit-variant.webp  toggle             (Cosmetic, "Outfit Variant")
 *   outfit-color.webp    colore             (Cosmetic, "Outfit Color")
 * in public/icons/categories/ (serie per sfondo scuro, inchiostro bianco) e in light/ (inchiostro nero).
 * Disegni dalle icone Lucide (licenza ISC): sono segnaposto in attesa delle icone del gioco (issue #109);
 * per sostituirle basta copiare i file definitivi con gli stessi nomi (e la variante light/).
 * Run: cd scripts && node make-outfit-category-icons.mjs
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons', 'categories');
mkdirSync(join(OUT, 'light'), { recursive: true });

const ICONS = {
  // Lucide "shirt"
  outfit: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  // Lucide "toggle-right"
  'outfit-variant': '<circle cx="15" cy="12" r="3"/><rect width="20" height="14" x="2" y="5" rx="7"/>',
  // Lucide "palette"
  'outfit-color': '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="INK"/><circle cx="17.5" cy="10.5" r=".5" fill="INK"/><circle cx="6.5" cy="12.5" r=".5" fill="INK"/><circle cx="8.5" cy="7.5" r=".5" fill="INK"/>',
};

const svg = (inner, ink) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.5 -1.5 27 27" width="256" height="256" fill="none" stroke="${ink}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${inner.replaceAll('INK', ink)}</svg>`;

for (const [name, inner] of Object.entries(ICONS)) {
  for (const [dir, ink] of [['', '#ffffff'], ['light', '#000000']]) {
    const buf = await sharp(Buffer.from(svg(inner, ink))).webp({ quality: 90, effort: 4 }).toBuffer();
    writeFileSync(join(OUT, dir, `${name}.webp`), buf);
    console.log(`${dir ? dir + '/' : ''}${name}.webp`);
  }
}
