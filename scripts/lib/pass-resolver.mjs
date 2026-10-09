/**
 * Risoluzione dei nomi inglesi delle ricompense di un pass (tabella Polygon) verso:
 *   1. un oggetto già nel nostro catalogo;
 *   2. un oggetto da creare come custom, con i dati di ARC Tracker quando ci sono;
 *   3. nulla (da segnalare).
 * Funzioni pure: il contesto (catalogo, cosmetici, oggetti ARC Tracker) arriva dal chiamante.
 */

export const normName = (s) =>
  String(s).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const slug = (s) => normName(s).replace(/ /g, '-');

/** Etichetta del tipo di cosmetico, come nei nomi del catalogo MetaForge: «Banana (Backpack Charm)». */
export const KIND_LABEL = {
  outfit: 'Outfit',
  'backpack-charm': 'Backpack Charm',
  'backpack-attachment': 'Backpack Attachment',
  backpack: 'Backpack',
  emote: 'Emote',
  'face-style': 'Face Style',
  hair: 'Hairstyle',
  'raider-tool': 'Raider Tool',
  'scrappy-outfit': 'Scrappy Outfit',
  face: 'Face',
  'facial-hair': 'Facial Hair',
};

const toTitle = (text) => text.replace(/\b([a-z])([a-z']*)/g, (_, a, rest) => `${a.toUpperCase()}${rest}`);

const WEAPON_WORDS = /\s+(hand cannon|battle rifle|assault rifle|sniper rifle|smg|lmg|shotgun|pistol|augment)$/i;
const OUTFIT_PIECES = ['accessories', 'colors', 'toggles', 'helmet', 'mask', 'jacket', 'balaclava', 'gas mask'];

/** «3 stencil parts» → { quantity: 3, text: 'stencil parts' }; «(Scrappy)» segnalato a parte. */
export function parseRewardName(raw) {
  let text = String(raw).trim();
  const scrappy = /\(scrappy\)/i.test(text);
  text = text.replace(/\s*\(scrappy\)/i, '').trim();
  let quantity = 1;
  const m = text.match(/^(\d+)\s+(.*)$/);
  if (m) {
    quantity = Number(m[1]);
    text = m[2];
  }
  return { quantity, text, scrappy };
}

/** Tipo di ricompensa dal nome (parole chiave del gioco). */
export function classify({ text, scrappy }) {
  const lower = text.toLowerCase();
  if (scrappy) return { kind: 'scrappy-outfit', base: text };
  for (const piece of OUTFIT_PIECES) {
    const m = lower.match(new RegExp(`^(.*) outfit ${piece}$`));
    if (m) return { kind: 'outfit-piece', outfit: text.slice(0, m[1].length), piece };
  }
  const suffixes = [
    ['outfit', 'outfit'],
    ['backpack charm', 'backpack-charm'],
    ['backpack attachment', 'backpack-attachment'],
    ['backpack', 'backpack'],
    ['emote', 'emote'],
    ['face style', 'face-style'],
    ['facial hair', 'facial-hair'],
    ['face', 'face'],
    ['hairstyle', 'hair'],
    ['raider tool', 'raider-tool'],
    ['furniture', 'furniture'],
    ['stencil', 'stencil'],
  ];
  for (const [word, kind] of suffixes) {
    if (lower.endsWith(` ${word}`)) return { kind, base: text.slice(0, text.length - word.length - 1) };
  }
  return { kind: 'item', base: text };
}

/** Nomi candidati di un oggetto: com'è, singolare, senza la classe dell'arma. */
function itemCandidates(text) {
  const out = new Set([normName(text)]);
  const noClass = text.replace(WEAPON_WORDS, '');
  out.add(normName(noClass));
  for (const t of [text, noClass]) {
    const n = normName(t);
    if (n.endsWith('ies')) out.add(`${n.slice(0, -3)}y`);
    if (n.endsWith('s')) out.add(n.slice(0, -1));
    if (n.endsWith('es')) out.add(n.slice(0, -2));
  }
  return [...out];
}

/** L'unico cosmetico il cui nome inizia con `prefix` (nessuno se sono più d'uno o nessuno). */
const uniquePrefixMatch = (map, prefix) => {
  if (!map) return undefined;
  const hits = [...map].filter(([name]) => name === prefix || name.startsWith(`${prefix} `)).map(([, value]) => value);
  return hits.length === 1 ? hits[0] : undefined;
};

const firstHit = (map, candidates) => {
  for (const c of candidates) if (map.has(c)) return map.get(c);
  return undefined;
};

/**
 * @param {string} raw nome come nella tabella
 * @param {{ catalog: Map<string,string>, cosmetics: Map<string, Map<string, object>>, atItems: Map<string, object> }} ctx
 *   catalog: nome inglese normalizzato → id; cosmetics: tipo → (nome inglese normalizzato → cosmetico);
 *   atItems: nome inglese normalizzato → oggetto ARC Tracker già normalizzato.
 */
export function resolveReward(raw, ctx) {
  const parsed = parseRewardName(raw);
  const { quantity, text } = parsed;
  const cls = classify(parsed);
  const base = { raw, quantity, kind: cls.kind };

  if (cls.kind === 'outfit-piece') {
    const outfitName = toTitle(cls.outfit);
    const outfit = ctx.cosmetics.get('outfit')?.get(normName(cls.outfit));
    const isColor = cls.piece === 'colors';
    // Stesse convenzioni di MetaForge: «Goggles (Radio Renegade Variant)», «Blue (Radio Renegade Color)»
    const name = isColor ? `Colors (${outfitName} Color)` : `${toTitle(cls.piece)} (${outfitName} Variant)`;
    const catalogHit = ctx.catalog.get(normName(name));
    if (catalogHit) return { ...base, status: 'catalog', itemId: catalogHit };
    return {
      ...base,
      status: 'create',
      create: {
        source: 'synthetic',
        kind: 'outfit-piece',
        id: slug(name),
        name,
        subcategory: isColor ? 'Outfit Color' : 'Outfit Variant',
        outfit: outfitName,
        outfitId: outfit?.id,
        outfitNameIt: outfit?.names.it,
        // L'immagine del pezzo è quella dell'outfit di base, se è nel catalogo
        baseItemId: ctx.catalog.get(normName(`${outfitName} outfit`)),
        piece: cls.piece,
      },
    };
  }

  if (cls.kind === 'item') {
    const id = firstHit(ctx.catalog, itemCandidates(text));
    if (id) return { ...base, status: 'catalog', itemId: id };
    if (/^raider tokens?$/i.test(text)) {
      return { ...base, status: 'create', create: { source: 'synthetic', id: 'raider-tokens', name: 'Raider Tokens', kind: 'currency', subcategory: '' } };
    }
    const at = firstHit(ctx.atItems, itemCandidates(text));
    if (at) return { ...base, status: 'create', create: { source: 'arctracker-item', id: at.id, name: at.names.en, at } };
    return { ...base, status: 'unresolved' };
  }

  if (cls.kind === 'stencil' || cls.kind === 'furniture') {
    const suffixed = firstHit(ctx.catalog, [normName(`${cls.base} ${cls.kind}`), ...itemCandidates(cls.base)]);
    if (suffixed) return { ...base, status: 'catalog', itemId: suffixed };
    const at = firstHit(ctx.atItems, itemCandidates(cls.base));
    if (at) return { ...base, status: 'create', create: { source: 'arctracker-item', id: cls.kind === 'stencil' ? `${slug(at.names.en)}-stencil` : at.id, name: cls.kind === 'stencil' ? `${at.names.en} (Stencil)` : at.names.en, at, kind: cls.kind } };
    return { ...base, status: 'unresolved' };
  }

  // Cosmetici: prima il catalogo («<nome> <tipo>»), poi la pagina cosmetici di ARC Tracker
  const catalogHit = firstHit(ctx.catalog, [normName(text), normName(`${cls.base} ${cls.kind.replace(/-/g, ' ')}`), normName(cls.base)]);
  if (catalogHit) return { ...base, status: 'catalog', itemId: catalogHit };
  const sameKind = ctx.cosmetics.get(cls.kind);
  const cosmetic = sameKind?.get(normName(cls.base)) ?? uniquePrefixMatch(sameKind, normName(cls.base));
  if (cosmetic) {
    return { ...base, status: 'create', create: { source: 'cosmetic', kind: cls.kind, cosmetic, id: slug(`${cosmetic.names.en} ${KIND_LABEL[cls.kind]}`), name: `${cosmetic.names.en} (${KIND_LABEL[cls.kind]})`, subcategory: KIND_LABEL[cls.kind] } };
  }
  return { ...base, status: 'unresolved' };
}
