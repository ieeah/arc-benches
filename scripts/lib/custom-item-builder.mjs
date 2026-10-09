/**
 * Voci di custom-items per gli oggetti creati dagli import dei pass: dalle ricompense risolte
 * (vedi pass-resolver.mjs) a una definizione compatibile con scripts/data/custom-items/items.json,
 * con le note «da rivedere» per ciò che nessuna fonte dice.
 */
import { KIND_LABEL } from './pass-resolver.mjs';

export const NOTE = {
  rarity: 'Rarità provvisoria (Common): da verificare in gioco',
  description: 'Descrizione mancante',
  icon: 'Icona assente: usa il fallback della sottocategoria',
  iconFromBase: "Usa l'immagine dell'outfit di base (icona vera da procurare)",
  nameIt: 'Nome italiano mancante',
  synthetic: 'Pezzo di outfit creato dalla tabella del pass: non esiste come oggetto in nessuna fonte',
  levels: (levels) => `Compare ai livelli ${levels.join(', ')}: potrebbero essere pacchetti diversi da distinguere`,
  currency: 'Valuta creata a mano: descrizione e icona da inserire',
  atIcon: 'Icona assente: l\'immagine è sul CDN di ARC Tracker e non viene importata',
};

/** Voce di custom-items per un oggetto da creare; `levels` = livelli del pass in cui compare. */
export function toCustomItem(create, levels) {
  const base = {
    id: create.id,
    name: create.name,
    description: '',
    icon: '',
    rarity: 'Common',
    item_type: 'Cosmetic',
    subcategory: create.subcategory ?? '',
    value: null,
    workbench: null,
    loot_area: '',
    stack_size: null,
  };
  const review = [];

  if (create.source === 'arctracker-item') {
    const at = create.at;
    return {
      ...base,
      description: at.descriptions.en ?? '',
      rarity: at.rarity ?? 'Common',
      item_type: create.kind === 'furniture' ? 'Furniture' : at.type === 'Stencil' ? 'Stencil' : at.type,
      subcategory: create.kind === 'stencil' ? '' : base.subcategory,
      value: at.value === null || at.value === undefined ? null : Number(at.value),
      stack_size: at.stackSize === null || at.stackSize === undefined ? null : Number(at.stackSize),
      translations: at.names.it ? { it: { name: at.names.it, ...(at.descriptions.it ? { description: at.descriptions.it } : {}) } } : undefined,
      review: [NOTE.atIcon, ...(at.descriptions.en ? [] : [NOTE.description])],
    };
  }

  if (create.source === 'synthetic' && create.kind === 'currency') {
    return { ...base, item_type: 'Currency', review: [NOTE.currency] };
  }

  if (create.source === 'synthetic') {
    review.push(NOTE.synthetic, NOTE.rarity, NOTE.description, create.baseItemId ? NOTE.iconFromBase : NOTE.icon, NOTE.nameIt);
    if (create.piece === 'colors' && levels.length > 1) review.push(NOTE.levels(levels));
    return { ...base, ...(create.baseItemId ? { iconFromItem: create.baseItemId } : {}), review };
  }

  // cosmetico dalla pagina di ARC Tracker: il nome italiano c'è, il resto no
  review.push(NOTE.rarity, NOTE.description, NOTE.icon);
  const cosmetic = create.cosmetic;
  return {
    ...base,
    item_type: create.kind === 'outfit' ? 'Outfits' : 'Cosmetic',
    translations: cosmetic.names.it ? { it: { name: cosmetic.names.it } } : undefined,
    review: cosmetic.names.it ? review : [...review, NOTE.nameIt],
  };
}

/** Le voci come le scriverebbe fetch-items nel catalogo (senza `review`, icona null). */
export const toCatalogItem = ({ review: _review, ...def }) => {
  void _review;
  return { ...def, icon: null };
};

/**
 * I pezzi di outfit creati dalla tabella di un pass («Colors (Caposta Color)») non hanno un'immagine
 * loro: usano quella dell'outfit di base. Imposta `iconFromItem` sui pezzi sintetici che non lo hanno
 * (e sposta la nota «da rivedere» dell'icona), cercando `<outfit>-outfit` nel catalogo.
 * Muta `customItems` e, se presente, la voce corrispondente di `items`; restituisce gli id modificati.
 */
export function inheritPieceIcons(customItems, items) {
  const changed = [];
  for (const [id, def] of Object.entries(customItems)) {
    if (def.iconFromItem || !def.review?.includes(NOTE.synthetic)) continue;
    const outfit = def.name.match(/\((.+?) (?:Variant|Color)\)$/)?.[1];
    if (!outfit) continue;
    const baseId = `${outfit.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-outfit`;
    if (!items[baseId]) continue;
    def.iconFromItem = baseId;
    def.review = def.review.map((note) => (note === NOTE.icon ? NOTE.iconFromBase : note));
    if (items[id]) items[id] = { ...items[id], iconFromItem: baseId };
    changed.push(id);
  }
  return changed;
}
