import { describe, it, expect } from 'vitest';
import { parseImport } from './listIO';
import type { MultiProfileExportFile } from '../types';

const list = {
  id: 'custom:1',
  name: 'L',
  maxLevel: 2,
  levels: [
    { level: 1, requirementItemIds: [{ itemId: 'a', quantity: 1 }] },
    { level: 2, requirementItemIds: [] },
  ],
};

const str = (o: unknown) => JSON.stringify(o);

describe('parseImport — structural errors', () => {
  it('throws on a non-object payload', () => {
    expect(() => parseImport('null')).toThrow();
    expect(() => parseImport('42')).toThrow();
  });
  it('throws on an unknown version', () => {
    expect(() => parseImport(str({ version: 5, lists: [] }))).toThrow();
  });
  it('throws on v2 without a lists array', () => {
    expect(() => parseImport(str({ version: 2 }))).toThrow();
  });
});

describe('parseImport — v1 (legacy ceiling)', () => {
  it('expands targetLevel into the set of levels above current', () => {
    const out = parseImport(str({ version: 1, lists: [{ list, currentLevel: 1, targetLevel: 3 }] }));
    expect(out.version).toBe(2); // normalized to v2 shape
    if (out.version === 3) throw new Error('unexpected v3');
    expect(out.lists[0].targetLevels).toEqual([2, 3]);
  });
});

describe('parseImport — v2 (single profile)', () => {
  it('keeps the explicit level set (floored, non-negative) and sanitizes inventory', () => {
    const out = parseImport(str({
      version: 2,
      lists: [{ list, currentLevel: 0, targetLevels: [1, 2.5, -1, 'x'], active: false }],
      inventory: { a: 5, b: -1, c: 'nope' },
    }));
    if (out.version === 3) throw new Error('unexpected v3');
    expect(out.lists[0].targetLevels).toEqual([1, 2]);
    expect(out.lists[0].active).toBe(false);
    expect(out.inventory).toEqual({ a: 5 });
  });

  it('drops malformed list entries but keeps the valid ones', () => {
    const out = parseImport(str({
      version: 2,
      lists: [{ list, currentLevel: 0, targetLevels: [1] }, { list: { id: '' } }, 'garbage'],
    }));
    if (out.version === 3) throw new Error('unexpected v3');
    expect(out.lists).toHaveLength(1);
    expect(out.lists[0].list.id).toBe('custom:1');
  });
});

describe('parseImport — v3 (multi-profile)', () => {
  it('validates profiles and shared lists, dropping invalid ones', () => {
    const out = parseImport(str({
      version: 3,
      sharedLists: [list, { id: '' }],
      profiles: [
        { profile: { id: 'p1', name: 'P' }, lists: [{ list, currentLevel: 1, targetLevels: [2], active: true }], inventory: { a: 2 } },
        { profile: { id: '' }, lists: [] },
      ],
    })) as MultiProfileExportFile;

    expect(out.version).toBe(3);
    expect(out.sharedLists).toHaveLength(1);
    expect(out.profiles).toHaveLength(1);
    expect(out.profiles[0].profile.id).toBe('p1');
    expect(out.profiles[0].inventory).toEqual({ a: 2 });
    expect(out.profiles[0].lists[0].targetLevels).toEqual([2]);
  });

  it('throws when no profile is valid', () => {
    expect(() => parseImport(str({ version: 3, sharedLists: [], profiles: [{ profile: { id: '' } }] }))).toThrow();
  });

  it('throws when profiles/sharedLists are not arrays', () => {
    expect(() => parseImport(str({ version: 3, sharedLists: {}, profiles: [] }))).toThrow();
  });
});
