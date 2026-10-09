/**
 * Costruzione del rapporto «oggetti di ARC Tracker assenti dal nostro catalogo». Funzioni pure,
 * senza accesso a rete o file, così si possono testare.
 */

const norm = (v) => (v === null || v === undefined || v === '' ? null : v);

/** Valori numerici arrivati come stringa («7000») o numero, confrontabili tra loro. */
const asNumber = (v) => {
  const n = norm(v);
  if (n === null) return null;
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : n;
};

/** Campi confrontati: [nome nel rapporto, valore nostro, valore loro]. */
const COMPARED_FIELDS = [
  ['item_type', (ours) => norm(ours.item_type), (theirs) => norm(theirs.type)],
  ['rarity', (ours) => norm(ours.rarity), (theirs) => norm(theirs.rarity)],
  ['value', (ours) => asNumber(ours.value), (theirs) => asNumber(theirs.value)],
  ['stack_size', (ours) => asNumber(ours.stack_size), (theirs) => asNumber(theirs.stackSize)],
];

const sameValue = (a, b) =>
  typeof a === 'string' && typeof b === 'string' ? a.toLowerCase() === b.toLowerCase() : a === b;

/**
 * @param {{ theirs: object[], ours: Record<string, object>, source: object }} input
 *   `theirs`: oggetti ARC Tracker già normalizzati (vedi `normalizeItem`); `ours`: il nostro `items.json`.
 */
export function buildMissingItemsReport({ theirs, ours, source }) {
  const theirIds = new Set(theirs.map((i) => i.id));
  const ourIds = Object.keys(ours);

  const onlyTheirs = theirs.filter((i) => !(i.id in ours));
  const onlyOurs = ourIds.filter((id) => !theirIds.has(id));
  const common = theirs.filter((i) => i.id in ours);

  const fieldDiffs = [];
  for (const item of common) {
    for (const [field, getOurs, getTheirs] of COMPARED_FIELDS) {
      const a = getOurs(ours[item.id]);
      const b = getTheirs(item);
      if (a !== null && b !== null && !sameValue(a, b)) fieldDiffs.push({ id: item.id, field, ours: a, theirs: b });
    }
  }

  // Oggetti nostri senza nome italiano che ARC Tracker ha (candidati al riempimento delle traduzioni, #104)
  const italianNameFillable = common.filter((i) => i.names.it && !ours[i.id].translations?.it?.name).map((i) => i.id);

  const countBy = (list, key) =>
    Object.fromEntries(
      [...list.reduce((m, x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1]),
    );

  return {
    generatedAt: new Date().toISOString(),
    source,
    summary: {
      theirs: theirs.length,
      ours: ourIds.length,
      common: common.length,
      onlyTheirs: onlyTheirs.length,
      onlyOurs: onlyOurs.length,
      fieldDiffs: fieldDiffs.length,
      fieldDiffsByField: countBy(fieldDiffs, (d) => d.field),
      italianNameFillable: italianNameFillable.length,
      onlyTheirsByType: countBy(onlyTheirs, (i) => i.type ?? 'unknown'),
    },
    /** Oggetti presenti solo su ARC Tracker, con tutti i loro dati. */
    onlyArcTracker: onlyTheirs,
    /** Id presenti solo da noi (outfit, custom…): per riscontro. */
    onlyOurs,
    /** Differenze sui campi in comune (tipo, rarità, valore, stack). */
    fieldDiffs,
    /** Id con nome italiano disponibile da ARC Tracker e mancante da noi. */
    italianNameFillable,
  };
}
