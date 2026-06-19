import { describe, it, expect } from 'vitest';
import {
  isObject,
  sanitizeNumberRecord,
  sanitizeNumberArrayRecord,
  sanitizeBoolRecord,
  sanitizeStringArray,
  validateList,
  validateProfile,
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
