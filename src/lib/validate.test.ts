import { describe, it, expect } from 'vitest';
import {
  isObject,
  sanitizeNumberRecord,
  sanitizeNumberArrayRecord,
  sanitizeBoolRecord,
  sanitizeStringArray,
  validateList,
  validateProfile,
  v,
} from './validate';

describe('isObject', () => {
  it('accepts plain objects only', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });
  it('rejects arrays, null and primitives', () => {
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject('x')).toBe(false);
    expect(isObject(3)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });
});

describe('sanitizeNumberRecord', () => {
  it('keeps finite values >= 0 and floors them', () => {
    expect(sanitizeNumberRecord({ a: 3, b: 2.9, c: 0 })).toEqual({ a: 3, b: 2, c: 0 });
  });
  it('drops negatives, NaN, Infinity and non-numbers', () => {
    expect(sanitizeNumberRecord({ a: -1, b: NaN, c: Infinity, d: '5', e: null })).toEqual({});
  });
  it('returns {} for non-objects', () => {
    expect(sanitizeNumberRecord(null)).toEqual({});
    expect(sanitizeNumberRecord([1, 2])).toEqual({});
  });
});

describe('sanitizeNumberArrayRecord', () => {
  it('filters bad elements inside arrays', () => {
    expect(sanitizeNumberArrayRecord({ a: [1, 2.5, -1, 'x', NaN, 3] })).toEqual({ a: [1, 2, 3] });
  });
  it('skips non-array values', () => {
    expect(sanitizeNumberArrayRecord({ a: 5, b: [1] })).toEqual({ b: [1] });
  });
});

describe('sanitizeBoolRecord', () => {
  it('keeps only booleans', () => {
    expect(sanitizeBoolRecord({ a: true, b: false, c: 1, d: 'true' })).toEqual({ a: true, b: false });
  });
});

describe('sanitizeStringArray', () => {
  it('keeps only strings', () => {
    expect(sanitizeStringArray(['a', 1, null, 'b'])).toEqual(['a', 'b']);
  });
  it('returns [] for non-arrays', () => {
    expect(sanitizeStringArray('a')).toEqual([]);
  });
});

describe('validateList', () => {
  const valid = {
    id: 'custom:1',
    name: 'Test',
    maxLevel: 2,
    levels: [
      { level: 1, requirementItemIds: [{ itemId: 'metal-parts', quantity: 3 }] },
      { level: 2, requirementItemIds: [], actions: [{ id: 'a1', label: 'do it' }] },
    ],
  };

  it('accepts a well-formed list', () => {
    const out = validateList(valid);
    expect(out).not.toBeNull();
    expect(out!.id).toBe('custom:1');
    expect(out!.levels).toHaveLength(2);
    expect(out!.levels[1].actions).toEqual([{ id: 'a1', label: 'do it' }]);
  });

  it('rejects missing id or name', () => {
    expect(validateList({ ...valid, id: '' })).toBeNull();
    expect(validateList({ ...valid, name: 123 })).toBeNull();
  });

  it('rejects a list with no usable levels', () => {
    expect(validateList({ ...valid, levels: [] })).toBeNull();
    expect(validateList({ ...valid, levels: [{ level: 'x', requirementItemIds: [] }] })).toBeNull();
  });

  it('drops malformed requirements but keeps the level', () => {
    const out = validateList({
      ...valid,
      levels: [{ level: 1, requirementItemIds: [{ itemId: 'ok', quantity: 1 }, { itemId: '', quantity: 2 }, { quantity: 3 }] }],
    });
    expect(out!.levels[0].requirementItemIds).toEqual([{ itemId: 'ok', quantity: 1 }]);
  });

  it('derives maxLevel from levels when missing/invalid', () => {
    const out = validateList({ ...valid, maxLevel: 'nope' });
    expect(out!.maxLevel).toBe(2);
  });

  it('carries custom / shared / listType flags', () => {
    const out = validateList({ ...valid, custom: true, shared: true, listType: 'project' });
    expect(out!.custom).toBe(true);
    expect(out!.shared).toBe(true);
    expect(out!.listType).toBe('project');
  });

  it('ignores an unknown listType', () => {
    const out = validateList({ ...valid, listType: 'bogus' });
    expect(out!.listType).toBeUndefined();
  });
});

describe('validateProfile', () => {
  it('accepts a valid profile', () => {
    expect(validateProfile({ id: 'p1', name: 'Main' })).toEqual({ id: 'p1', name: 'Main' });
  });
  it('rejects missing fields', () => {
    expect(validateProfile({ id: 'p1' })).toBeNull();
    expect(validateProfile({ name: 'Main' })).toBeNull();
    expect(validateProfile(null)).toBeNull();
  });
});

// ── v schema builder (TDD — red first) ──────────────────────────────────────

describe('v.string()', () => {
  it('accepts a non-empty string', () => {
    expect(v.string().parse('hello', '')).toBe('hello');
  });
  it('rejects empty string → fallback', () => {
    expect(v.string().parse('', 'fb')).toBe('fb');
  });
  it('rejects non-strings → fallback', () => {
    expect(v.string().parse(42, 'fb')).toBe('fb');
    expect(v.string().parse(null, 'fb')).toBe('fb');
    expect(v.string().parse(undefined, 'fb')).toBe('fb');
  });
  it('.nullable() accepts null', () => {
    expect(v.string().nullable().parse(null, 'fb')).toBeNull();
    expect(v.string().nullable().parse('hi', null)).toBe('hi');
    expect(v.string().nullable().parse('', null)).toBeNull();
  });
  it('.optional() accepts undefined', () => {
    expect(v.string().optional().parse(undefined, 'fb')).toBeUndefined();
    expect(v.string().optional().parse('hi', undefined)).toBe('hi');
  });
});

describe('v.number()', () => {
  it('accepts a finite number and floors it', () => {
    expect(v.number().parse(3, 0)).toBe(3);
    expect(v.number().parse(2.9, 0)).toBe(2);
  });
  it('rejects NaN, Infinity, -Infinity → fallback', () => {
    expect(v.number().parse(NaN, -1)).toBe(-1);
    expect(v.number().parse(Infinity, -1)).toBe(-1);
    expect(v.number().parse(-Infinity, -1)).toBe(-1);
  });
  it('rejects non-numbers → fallback', () => {
    expect(v.number().parse('5', -1)).toBe(-1);
    expect(v.number().parse(null, -1)).toBe(-1);
  });
  it('min option rejects values below threshold', () => {
    expect(v.number({ min: 0 }).parse(-1, 0)).toBe(0);
    expect(v.number({ min: 1 }).parse(0, 1)).toBe(1);
    expect(v.number({ min: 1 }).parse(1, 0)).toBe(1);
  });
  it('.nullable() accepts null', () => {
    expect(v.number().nullable().parse(null, 0)).toBeNull();
  });
});

describe('v.boolean()', () => {
  it('accepts true and false', () => {
    expect(v.boolean().parse(true, false)).toBe(true);
    expect(v.boolean().parse(false, true)).toBe(false);
  });
  it('rejects truthy/falsy non-booleans → fallback', () => {
    expect(v.boolean().parse(1, false)).toBe(false);
    expect(v.boolean().parse(0, true)).toBe(true);
    expect(v.boolean().parse('true', false)).toBe(false);
    expect(v.boolean().parse(null, true)).toBe(true);
  });
  it('.nullable() accepts null', () => {
    expect(v.boolean().nullable().parse(null, false)).toBeNull();
  });
});

describe('v.literal()', () => {
  it('accepts the exact value', () => {
    expect(v.literal('dark').parse('dark', 'light')).toBe('dark');
    expect(v.literal(42).parse(42, 0)).toBe(42);
  });
  it('rejects any other value → fallback', () => {
    expect(v.literal('dark').parse('light', 'dark')).toBe('dark');
    expect(v.literal('dark').parse(null, 'dark')).toBe('dark');
  });
});

describe('v.oneOf()', () => {
  const schema = v.oneOf(['asc', 'desc', 'name'] as const);

  it('accepts values in the set', () => {
    expect(schema.parse('asc', 'desc')).toBe('asc');
    expect(schema.parse('name', 'desc')).toBe('name');
  });
  it('rejects values not in the set → fallback', () => {
    expect(schema.parse('invalid', 'asc')).toBe('asc');
    expect(schema.parse(null, 'asc')).toBe('asc');
    expect(schema.parse(42, 'asc')).toBe('asc');
  });
});

describe('v.object()', () => {
  const schema = v.object({
    open: v.boolean(),
    count: v.number({ min: 0 }),
    label: v.string(),
  });

  it('accepts a fully valid object', () => {
    expect(schema.parse({ open: true, count: 3, label: 'hi' }, { open: false, count: 0, label: '' }))
      .toEqual({ open: true, count: 3, label: 'hi' });
  });
  it('falls back field-by-field (lenient: keeps valid fields)', () => {
    const fallback = { open: false, count: 0, label: 'fb' };
    const result = schema.parse({ open: true, count: 'bad', label: 'hi' }, fallback);
    expect(result.open).toBe(true);
    expect(result.count).toBe(0);   // field fallback
    expect(result.label).toBe('hi');
  });
  it('returns full fallback for non-objects', () => {
    const fallback = { open: false, count: 0, label: 'fb' };
    expect(schema.parse(null, fallback)).toEqual(fallback);
    expect(schema.parse('string', fallback)).toEqual(fallback);
    expect(schema.parse([], fallback)).toEqual(fallback);
  });
  it('ignores extra keys not in schema', () => {
    const result = schema.parse({ open: true, count: 1, label: 'x', extra: 999 }, { open: false, count: 0, label: '' });
    expect((result as Record<string, unknown>).extra).toBeUndefined();
  });
});

describe('v.array()', () => {
  const schema = v.array(v.number({ min: 0 }));

  it('filters out invalid elements, keeps valid ones', () => {
    expect(schema.parse([1, 'bad', -1, 2, NaN, 3], [])).toEqual([1, 2, 3]);
  });
  it('returns empty array for non-arrays → fallback', () => {
    expect(schema.parse(null, [])).toEqual([]);
    expect(schema.parse('x', [])).toEqual([]);
  });
  it('returns empty array for an all-invalid input', () => {
    expect(schema.parse(['a', 'b'], [])).toEqual([]);
  });
  it('works with string items', () => {
    const ss = v.array(v.string());
    expect(ss.parse(['a', '', 1, 'b'], [])).toEqual(['a', 'b']);
  });
});

describe('v.object() with nullable fields', () => {
  const schema = v.object({
    tag: v.string().nullable(),
    val: v.number().nullable(),
  });

  it('keeps null for nullable fields', () => {
    expect(schema.parse({ tag: null, val: null }, { tag: 'fb', val: 0 }))
      .toEqual({ tag: null, val: null });
  });
  it('falls back only invalid non-null values', () => {
    expect(schema.parse({ tag: 42, val: 'x' }, { tag: 'fb', val: 0 }))
      .toEqual({ tag: 'fb', val: 0 });
  });
});

describe('v — never throws', () => {
  it('parse never throws regardless of input', () => {
    const schema = v.object({ x: v.string() });
    expect(() => schema.parse(undefined, { x: '' })).not.toThrow();
    expect(() => schema.parse(Symbol('x'), { x: '' })).not.toThrow();
    expect(() => v.array(v.boolean()).parse({ 0: true }, [])).not.toThrow();
  });
});
