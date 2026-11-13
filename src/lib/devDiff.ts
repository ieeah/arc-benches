export type DiffLineType = 'add' | 'remove' | 'change' | 'same';

export type DiffLine = {
  type: DiffLineType;
  text: string;
  key?: string;
  oldVal?: unknown;
  newVal?: unknown;
};

export type DiffResult = {
  hasChanges: boolean;
  diffLines: DiffLine[];
  summary: {
    added: number;
    removed: number;
    changed: number;
  };
};

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, k)) return false;
    if (!isDeepEqual(objA[k], objB[k])) return false;
  }
  return true;
}

function formatValue(v: unknown): string {
  if (v === undefined) return 'undefined';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Calcola la differenza strutturata tra due valori JSON (oggetti, array o primitivi).
 * Restituisce le righe di diff con tipo ('add' | 'remove' | 'change' | 'same')
 * e un riepilogo con il conteggio delle modifiche.
 */
export function computeJsonDiff(original: unknown, modified: unknown): DiffResult {
  const summary = { added: 0, removed: 0, changed: 0 };
  const diffLines: DiffLine[] = [];

  const isObjA = original !== null && typeof original === 'object' && !Array.isArray(original);
  const isObjB = modified !== null && typeof modified === 'object' && !Array.isArray(modified);

  const isArrA = Array.isArray(original);
  const isArrB = Array.isArray(modified);

  if (isObjA && isObjB) {
    const objA = original as Record<string, unknown>;
    const objB = modified as Record<string, unknown>;
    const allKeys = Array.from(new Set([...Object.keys(objA), ...Object.keys(objB)])).sort();

    for (const k of allKeys) {
      const inA = Object.prototype.hasOwnProperty.call(objA, k);
      const inB = Object.prototype.hasOwnProperty.call(objB, k);

      if (!inA && inB) {
        summary.added++;
        diffLines.push({
          type: 'add',
          key: k,
          newVal: objB[k],
          text: `+ "${k}": ${formatValue(objB[k])}`,
        });
      } else if (inA && !inB) {
        summary.removed++;
        diffLines.push({
          type: 'remove',
          key: k,
          oldVal: objA[k],
          text: `- "${k}": ${formatValue(objA[k])}`,
        });
      } else if (isDeepEqual(objA[k], objB[k])) {
        diffLines.push({
          type: 'same',
          key: k,
          oldVal: objA[k],
          newVal: objB[k],
          text: `  "${k}": ${formatValue(objA[k])}`,
        });
      } else {
        summary.changed++;
        diffLines.push({
          type: 'change',
          key: k,
          oldVal: objA[k],
          newVal: objB[k],
          text: `~ "${k}": ${formatValue(objA[k])} -> ${formatValue(objB[k])}`,
        });
      }
    }
  } else if (isArrA && isArrB) {
    const arrA = original as unknown[];
    const arrB = modified as unknown[];
    const maxLen = Math.max(arrA.length, arrB.length);

    for (let i = 0; i < maxLen; i++) {
      if (i >= arrA.length) {
        summary.added++;
        diffLines.push({
          type: 'add',
          key: `[${i}]`,
          newVal: arrB[i],
          text: `+ [${i}]: ${formatValue(arrB[i])}`,
        });
      } else if (i >= arrB.length) {
        summary.removed++;
        diffLines.push({
          type: 'remove',
          key: `[${i}]`,
          oldVal: arrA[i],
          text: `- [${i}]: ${formatValue(arrA[i])}`,
        });
      } else if (isDeepEqual(arrA[i], arrB[i])) {
        diffLines.push({
          type: 'same',
          key: `[${i}]`,
          oldVal: arrA[i],
          newVal: arrB[i],
          text: `  [${i}]: ${formatValue(arrA[i])}`,
        });
      } else {
        summary.changed++;
        diffLines.push({
          type: 'change',
          key: `[${i}]`,
          oldVal: arrA[i],
          newVal: arrB[i],
          text: `~ [${i}]: ${formatValue(arrA[i])} -> ${formatValue(arrB[i])}`,
        });
      }
    }
  } else {
    if (isDeepEqual(original, modified)) {
      diffLines.push({
        type: 'same',
        text: `  ${formatValue(original)}`,
        oldVal: original,
        newVal: modified,
      });
    } else {
      summary.changed++;
      diffLines.push({
        type: 'change',
        text: `~ ${formatValue(original)} -> ${formatValue(modified)}`,
        oldVal: original,
        newVal: modified,
      });
    }
  }

  const hasChanges = summary.added > 0 || summary.removed > 0 || summary.changed > 0;

  return {
    hasChanges,
    diffLines,
    summary,
  };
}
