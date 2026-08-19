import type { CheckboxAction, ItemRequirement, List, ListLevel, ListType, Profile } from '../types';

/**
 * Runtime validation / sanitization at the deserialization boundary.
 *
 * Everything that enters the app from an untrusted source — localStorage (which the user, an
 * extension, or another tab can tamper with) and imported JSON files — passes through here before
 * touching the store. Hand-rolled guards (no dependency: same zero-lockfile-risk rationale as cn()).
 *
 * Policy: be lenient on load (drop bad entries, keep the good ones so a partially-corrupt profile
 * still opens) and structurally strict on import (reject a malformed file wholesale, but sanitize
 * its contents). The same guards will validate remote sync payloads later.
 */

// ── primitives ──────────────────────────────────────────────────────────────

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Finite number ≥ min (default 0), else null. */
const asNonNegInt = (v: unknown, min = 0): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= min ? Math.floor(v) : null;

const asNonEmptyString = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

// ── record sanitizers (keep only valid entries) ──────────────────────────────

/** `Record<string, number>` keeping finite values ≥ 0 (inventory, hideoutLevels). */
export const sanitizeNumberRecord = (v: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (!isObject(v)) return out;
  for (const [k, val] of Object.entries(v)) {
    const n = asNonNegInt(val);
    if (n !== null) out[k] = n;
  }
  return out;
};

/** `Record<string, number[]>` keeping arrays of finite ints ≥ 0 (targetLevels). */
export const sanitizeNumberArrayRecord = (v: unknown): Record<string, number[]> => {
  const out: Record<string, number[]> = {};
  if (!isObject(v)) return out;
  for (const [k, val] of Object.entries(v)) {
    if (!Array.isArray(val)) continue;
    const nums = val.map(n => asNonNegInt(n)).filter((n): n is number => n !== null);
    out[k] = nums;
  }
  return out;
};

/** `Record<string, boolean>` keeping boolean values (activeModules). */
export const sanitizeBoolRecord = (v: unknown): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  if (!isObject(v)) return out;
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'boolean') out[k] = val;
  }
  return out;
};

export const sanitizeStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];

// ── domain shapes ────────────────────────────────────────────────────────────

const validateRequirement = (v: unknown): ItemRequirement | null => {
  if (!isObject(v)) return null;
  const itemId = asNonEmptyString(v.itemId);
  const quantity = asNonNegInt(v.quantity);
  if (itemId === null || quantity === null) return null;
  return { itemId, quantity };
};

const validateAction = (v: unknown): CheckboxAction | null => {
  if (!isObject(v)) return null;
  const id = asNonEmptyString(v.id);
  const label = typeof v.label === 'string' ? v.label : null;
  if (id === null || label === null) return null;
  return { id, label };
};

const validateLevel = (v: unknown): ListLevel | null => {
  if (!isObject(v)) return null;
  const level = asNonNegInt(v.level, 1);
  if (level === null) return null;
  const requirementItemIds = Array.isArray(v.requirementItemIds)
    ? v.requirementItemIds.map(validateRequirement).filter((r): r is ItemRequirement => r !== null)
    : [];
  const actions = Array.isArray(v.actions)
    ? v.actions.map(validateAction).filter((a): a is CheckboxAction => a !== null)
    : undefined;
  const out: ListLevel = { level, requirementItemIds };
  if (actions && actions.length > 0) out.actions = actions;
  return out;
};

const LIST_TYPES: ListType[] = ['workbench', 'project', 'quest', 'custom'];

/** Validate a full `List` definition. Returns null if structurally unusable. */
export const validateList = (v: unknown): List | null => {
  if (!isObject(v)) return null;
  const id = asNonEmptyString(v.id);
  const name = typeof v.name === 'string' ? v.name : null;
  if (id === null || name === null) return null;

  const levels = Array.isArray(v.levels)
    ? v.levels.map(validateLevel).filter((l): l is ListLevel => l !== null)
    : [];
  if (levels.length === 0) return null;

  const maxFromLevels = Math.max(...levels.map(l => l.level));
  const maxLevel = asNonNegInt(v.maxLevel, 1) ?? maxFromLevels;

  const out: List = { id, name, maxLevel, levels };
  if (v.custom === true) out.custom = true;
  if (v.shared === true) out.shared = true;
  if (typeof v.listType === 'string' && LIST_TYPES.includes(v.listType as ListType)) {
    out.listType = v.listType as ListType;
  }
  return out;
};

export const validateProfile = (v: unknown): Profile | null => {
  if (!isObject(v)) return null;
  const id = asNonEmptyString(v.id);
  const name = typeof v.name === 'string' ? v.name : null;
  if (id === null || name === null) return null;
  return { id, name };
};

// ── v — schema builder ────────────────────────────────────────────────────────
//
// Mini-libreria di validazione componibile senza dipendenze esterne.
// Ogni schema espone `.parse(value, fallback)` che restituisce il valore
// validato oppure il fallback — non lancia mai. `.nullable()` e `.optional()`
// wrappano qualsiasi schema per accettare null/undefined.
//
// Policy: lenient on load — v.object valida campo per campo e fa fallback solo
// sui campi non validi, coerente con sanitizeProfileState (keep the good ones).

/** Tipo inferito da uno schema: `v.infer<typeof mySchema>`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type infer<S> = S extends Schema<any> ? ReturnType<S['_type']> : never;

abstract class Schema<T> {
  /** Usato solo per l'inferenza TypeScript — non chiamarlo a runtime. */
  abstract _type(): T;

  /** Valida `value`. Restituisce il valore validato, o `INVALID` se non valido. Mai lancia. */
  abstract _validate(value: unknown): T | typeof INVALID;

  parse(value: unknown, fallback: T): T {
    try {
      const result = this._validate(value);
      return result !== INVALID ? (result as T) : fallback;
    } catch {
      return fallback;
    }
  }

  /** Restituisce uno schema che accetta anche `null`. */
  nullable(): NullableSchema<T> {
    return new NullableSchema(this);
  }

  /** Restituisce uno schema che accetta anche `undefined`. */
  optional(): OptionalSchema<T> {
    return new OptionalSchema(this);
  }
}

/** Sentinella interna: distingue "campo non valido" da "campo validato come undefined/null". */
const INVALID = Symbol('INVALID');

class NullableSchema<T> extends Schema<T | null> {
  constructor(private readonly inner: Schema<T>) { super(); }
  _type(): T | null { return null as T | null; }
  _validate(value: unknown): T | null | typeof INVALID {
    if (value === null) return null;
    return this.inner._validate(value) as T | null | typeof INVALID;
  }
}

class OptionalSchema<T> extends Schema<T | undefined> {
  constructor(private readonly inner: Schema<T>) { super(); }
  _type(): T | undefined { return undefined; }
  _validate(value: unknown): T | undefined | typeof INVALID {
    if (value === undefined) return undefined;
    return this.inner._validate(value) as T | undefined | typeof INVALID;
  }
  /** Override: il fallback può essere `undefined` e il risultato valido anche. */
  parse(value: unknown, fallback: T | undefined): T | undefined {
    try {
      const result = this._validate(value);
      return result !== INVALID ? (result as T | undefined) : fallback;
    } catch {
      return fallback;
    }
  }
}

class StringSchema extends Schema<string> {
  _type(): string { return ''; }
  _validate(value: unknown): string | typeof INVALID {
    return typeof value === 'string' && value.length > 0 ? value : INVALID;
  }
}

class NumberSchema extends Schema<number> {
  constructor(private readonly min: number = -Infinity) { super(); }
  _type(): number { return 0; }
  _validate(value: unknown): number | typeof INVALID {
    if (typeof value !== 'number' || !Number.isFinite(value)) return INVALID;
    const n = Math.floor(value);
    return n >= this.min ? n : INVALID;
  }
}

class BooleanSchema extends Schema<boolean> {
  _type(): boolean { return false; }
  _validate(value: unknown): boolean | typeof INVALID {
    return typeof value === 'boolean' ? value : INVALID;
  }
}

class LiteralSchema<T extends string | number | boolean> extends Schema<T> {
  constructor(private readonly expected: T) { super(); }
  _type(): T { return this.expected; }
  _validate(value: unknown): T | typeof INVALID {
    return value === this.expected ? this.expected : INVALID;
  }
}

class OneOfSchema<T extends string | number | boolean> extends Schema<T> {
  constructor(private readonly values: readonly T[]) { super(); }
  _type(): T { return this.values[0]; }
  _validate(value: unknown): T | typeof INVALID {
    return this.values.includes(value as T) ? (value as T) : INVALID;
  }
}

type SchemaShape = Record<string, Schema<unknown>>;
type ShapeOutput<S extends SchemaShape> = { [K in keyof S]: ReturnType<S[K]['_type']> };

class ObjectSchema<S extends SchemaShape> extends Schema<ShapeOutput<S>> {
  constructor(private readonly shape: S) { super(); }
  _type(): ShapeOutput<S> { return {} as ShapeOutput<S>; }

  _validate(value: unknown): ShapeOutput<S> | typeof INVALID {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return INVALID;
    const obj = value as Record<string, unknown>;
    const out = {} as ShapeOutput<S>;
    for (const key of Object.keys(this.shape) as Array<keyof S>) {
      const parsed = this.shape[key]._validate(obj[key as string]);
      // Mappa INVALID → undefined come sentinella interna per il campo (gestita in parse)
      (out as Record<string, unknown>)[key as string] = parsed === INVALID ? undefined : parsed;
    }
    return out;
  }

  /** Override: fallback campo per campo (lenient). */
  parse(value: unknown, fallback: ShapeOutput<S>): ShapeOutput<S> {
    try {
      const result = this._validate(value);
      if (result === INVALID) return fallback;
      const out = {} as ShapeOutput<S>;
      for (const key of Object.keys(this.shape) as Array<keyof S>) {
        const fieldVal = (result as Record<string, unknown>)[key as string];
        (out as Record<string, unknown>)[key as string] =
          fieldVal !== undefined ? fieldVal : (fallback as Record<string, unknown>)[key as string];
      }
      return out;
    } catch {
      return fallback;
    }
  }
}

class ArraySchema<T> extends Schema<T[]> {
  constructor(private readonly item: Schema<T>) { super(); }
  _type(): T[] { return []; }
  _validate(value: unknown): T[] | typeof INVALID {
    if (!Array.isArray(value)) return INVALID;
    const out: T[] = [];
    for (const el of value) {
      const parsed = this.item._validate(el);
      if (parsed !== INVALID) out.push(parsed as T);
    }
    return out;
  }
}

/** Namespace del schema builder. */
export const v = {
  /** Stringa non vuota. */
  string: (): StringSchema => new StringSchema(),
  /** Numero finito, opzionalmente con soglia `min` (default: nessun limite inferiore). Floorizzato. */
  number: (opts?: { min?: number }): NumberSchema => new NumberSchema(opts?.min),
  /** Booleano esatto (`true`/`false`). */
  boolean: (): BooleanSchema => new BooleanSchema(),
  /** Letterale esatto. */
  literal: <T extends string | number | boolean>(val: T): LiteralSchema<T> => new LiteralSchema(val),
  /** Uno tra un insieme fisso di valori (union di letterali). */
  oneOf: <T extends string | number | boolean>(values: readonly T[]): OneOfSchema<T> => new OneOfSchema(values),
  /** Oggetto con schema per ciascuna chiave. Fallback campo per campo (lenient). */
  object: <S extends SchemaShape>(shape: S): ObjectSchema<S> => new ObjectSchema(shape),
  /** Array con filtraggio degli elementi non validi. */
  array: <T>(item: Schema<T>): ArraySchema<T> => new ArraySchema(item),
  /** Helper di tipo: `v.infer<typeof mySchema>` → tipo TypeScript corrispondente. */
  infer: undefined as unknown as <S>(schema: S) => S extends Schema<infer T> ? T : never,
} as const;
