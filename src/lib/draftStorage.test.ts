import { describe, it, expect, beforeEach, vi } from 'vitest';
import { persistDraftOrClear, pickChangedBuckets } from './draftStorage';

describe('pickChangedBuckets', () => {
  it('keeps only the buckets that differ from the files', () => {
    const initial = { workbench: [{ id: 'a' }], pass: [{ id: 'p' }], custom: [] };
    const current = { workbench: [{ id: 'a' }, { id: 'b' }], pass: [{ id: 'p' }], custom: [] };
    expect(pickChangedBuckets(current, initial)).toEqual({ workbench: current.workbench });
  });

  it('returns nothing when the draft mirrors the files, whatever the key order inside objects', () => {
    const initial = { items: { a: { x: 1, y: 2 } } };
    expect(pickChangedBuckets({ items: { a: { x: 1, y: 2 } } }, initial)).toEqual({});
  });

  it('treats a missing initial bucket as empty', () => {
    expect(pickChangedBuckets({ custom: [] }, {})).toEqual({});
    expect(pickChangedBuckets({ custom: [{ id: 'c' }] }, {})).toEqual({ custom: [{ id: 'c' }] });
  });
});

describe('persistDraftOrClear', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  it('writes a non-empty draft and removes the key when nothing differs', () => {
    persistDraftOrClear('k', { pass: [{ id: 'p' }] });
    expect(JSON.parse(store.get('k')!)).toEqual({ pass: [{ id: 'p' }] });
    persistDraftOrClear('k', {});
    expect(store.has('k')).toBe(false);
    persistDraftOrClear('k', null);
    expect(store.has('k')).toBe(false);
  });
});
