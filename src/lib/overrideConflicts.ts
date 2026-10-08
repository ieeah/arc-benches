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

/** conflictKey -> firma del conflitto al momento in cui l'override è stato mantenuto. */
export type ResolvedConflicts = Record<string, string>;

type OverrideMap = Record<string, Record<string, unknown>>;

export const CONFLICT_KIND_LABELS: Record<ConflictKind, string> = {
  changed: 'Upstream cambiato',
  redundant: 'Ridondante',
  orphan: 'Orfano',
};

const RESOLVED_STORAGE_KEY = 'dev_overrides_conflicts_resolved';

export const conflictKey = (c: Pick<OverrideConflict, 'id' | 'key'>) => `${c.id}::${c.key}`;

// Se upstream si muove di nuovo la firma cambia e il conflitto "mantenuto" riappare.
const conflictSignature = (c: OverrideConflict) => `${c.kind}|${JSON.stringify(c.newUpstream ?? null)}`;

/** Conflitti ancora da rivedere: l'override esiste ancora e non è stato marcato come mantenuto. */
export function getActiveConflicts(
  conflicts: OverrideConflict[],
  overrides: OverrideMap,
  resolved: ResolvedConflicts,
): OverrideConflict[] {
  return conflicts.filter(c => {
    const entry = overrides[c.id];
    if (!entry) return false;
    if (c.kind !== 'orphan' && !(c.key in entry)) return false;
    return resolved[conflictKey(c)] !== conflictSignature(c);
  });
}

/** "Mantieni override": ricorda il conflitto come rivisto finché upstream non cambia ancora. */
export function markConflictsResolved(resolved: ResolvedConflicts, conflicts: OverrideConflict[]): ResolvedConflicts {
  const next = { ...resolved };
  for (const c of conflicts) next[conflictKey(c)] = conflictSignature(c);
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
    if (Object.keys(rest).length === 0) delete next[c.id];
    else next[c.id] = rest;
  }
  return next;
}

export function formatConflictValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '∅';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

export function loadResolvedConflicts(): ResolvedConflicts {
  try {
    const raw = localStorage.getItem(RESOLVED_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ResolvedConflicts;
  } catch { /* storage non disponibile o JSON corrotto: si riparte da vuoto */ }
  return {};
}

export function saveResolvedConflicts(resolved: ResolvedConflicts): void {
  try {
    localStorage.setItem(RESOLVED_STORAGE_KEY, JSON.stringify(resolved));
  } catch { /* ignore */ }
}
