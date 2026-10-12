// Conflitti tra gli override locali (items-overrides.json) e il catalogo upstream MetaForge.
// Il file src/data/overrides-conflicts.json è generato da scripts/fetch-items.mjs; qui c'è la
// logica pura per filtrarlo e risolverlo dalla DevOverridesPage.

export type ConflictKind = 'changed' | 'redundant' | 'orphan';

export interface OverrideConflict {
  id: string;
  /** Campo in conflitto; '*' per un override il cui oggetto non esiste più upstream. */
  key: string;
  kind: ConflictKind;
  oldUpstream: unknown;
  newUpstream: unknown;
  overrideVal: unknown;
  detectedAt: string;
}

type OverrideEntry = Record<string, unknown>;
type OverrideMap = Record<string, OverrideEntry>;

/**
 * Campo riservato dentro ogni override: campo conflitto -> firma del conflitto al momento in cui
 * è stato "mantenuto". Non è un campo dell'oggetto: va escluso da ogni merge sugli item.
 */
export const REVIEW_FIELD = 'reviewed';
type ReviewMap = Record<string, string>;

export const CONFLICT_KIND_LABELS: Record<ConflictKind, string> = {
  changed: 'Upstream cambiato',
  redundant: 'Ridondante',
  orphan: 'Orfano',
};

export const conflictKey = (c: Pick<OverrideConflict, 'id' | 'key'>) => `${c.id}::${c.key}`;

// Se upstream si muove di nuovo la firma cambia e il conflitto "mantenuto" riappare.
export const conflictSignature = (c: OverrideConflict) => `${c.kind}|${JSON.stringify(c.newUpstream ?? null)}`;

/** Override senza il campo riservato `reviewed`, da usare ovunque l'override venga unito a un item. */
export function stripReview<T extends OverrideEntry>(entry: T): Omit<T, typeof REVIEW_FIELD> {
  const { [REVIEW_FIELD]: _reviewed, ...fields } = entry;
  return fields as Omit<T, typeof REVIEW_FIELD>;
}

/** Conflitti ancora da rivedere: l'override esiste ancora e non è stato marcato come mantenuto. */
export function getActiveConflicts(conflicts: OverrideConflict[], overrides: OverrideMap): OverrideConflict[] {
  return conflicts.filter(c => {
    const entry = overrides[c.id];
    if (!entry) return false;
    if (c.kind !== 'orphan' && !(c.key in entry)) return false;
    const reviewed = entry[REVIEW_FIELD] as ReviewMap | undefined;
    return reviewed?.[c.key] !== conflictSignature(c);
  });
}

/** "Mantieni override": segna il conflitto come rivisto nell'override stesso, finché upstream non cambia ancora. */
export function markConflictsResolved(overrides: OverrideMap, conflicts: OverrideConflict[]): OverrideMap {
  const next = { ...overrides };
  for (const c of conflicts) {
    const entry = next[c.id];
    if (!entry) continue;
    const reviewed = (entry[REVIEW_FIELD] ?? {}) as ReviewMap;
    next[c.id] = { ...entry, [REVIEW_FIELD]: { ...reviewed, [c.key]: conflictSignature(c) } };
  }
  return next;
}

/** "Adotta upstream": toglie il campo dall'override (l'intero override per gli orfani). */
export function adoptUpstream(overrides: OverrideMap, conflicts: OverrideConflict[]): OverrideMap {
  const next = { ...overrides };
  for (const c of conflicts) {
    if (c.kind === 'orphan') {
      delete next[c.id];
      continue;
    }
    const entry = next[c.id];
    if (!entry || !(c.key in entry)) continue;
    const { [c.key]: _removed, ...rest } = entry;
    const reviewed = rest[REVIEW_FIELD] as ReviewMap | undefined;
    if (reviewed) {
      const { [c.key]: _forgotten, ...otherReviews } = reviewed;
      if (Object.keys(otherReviews).length === 0) delete rest[REVIEW_FIELD];
      else rest[REVIEW_FIELD] = otherReviews;
    }
    if (Object.keys(stripReview(rest)).length === 0) delete next[c.id];
    else next[c.id] = rest;
  }
  return next;
}

export function formatConflictValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '∅';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}
