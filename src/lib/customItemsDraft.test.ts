import { describe, it, expect } from 'vitest';
import { emptyCustomItem, fromStoredDraft, toStoredDraft, type CustomItemDef, type CustomItemsMap } from './customItems';

const item = (id: string, patch: Partial<CustomItemDef> = {}): CustomItemDef => ({ ...emptyCustomItem(id), name: id.toUpperCase(), item_type: 'Currency', ...patch });
const baseline: CustomItemsMap = { a: item('a'), b: item('b') };

describe('custom items draft stored as differences', () => {
  it('stores only added and modified items, and explicit removals', () => {
    const stored = toStoredDraft({ items: { a: item('a'), c: item('c'), b: item('b', { rarity: 'Rare' }) }, icons: {} }, baseline);
    expect(Object.keys(stored.upserts).sort()).toEqual(['b', 'c']);
    expect(stored.removed).toEqual([]);
    expect(toStoredDraft({ items: { a: item('a') }, icons: {} }, baseline).removed).toEqual(['b']);
  });

  it('stores nothing for a draft identical to the file', () => {
    const stored = toStoredDraft({ items: { ...baseline }, icons: {} }, baseline);
    expect(stored.upserts).toEqual({});
    expect(stored.removed).toEqual([]);
  });

  it('rebuilds the full draft on top of the CURRENT file, so items added to the file later are kept', () => {
    const stored = toStoredDraft({ items: { a: item('a', { rarity: 'Epic' }), b: item('b') }, icons: { 'a.png': 'data:x' } }, baseline);
    const newerFile: CustomItemsMap = { ...baseline, z: item('z') };
    const draft = fromStoredDraft(stored, newerFile)!;
    expect(Object.keys(draft.items).sort()).toEqual(['a', 'b', 'z']);
    expect(draft.items.a.rarity).toBe('Epic');
    expect(draft.icons).toEqual({ 'a.png': 'data:x' });
  });

  it('applies explicit removals', () => {
    const stored = toStoredDraft({ items: { a: item('a') }, icons: {} }, baseline);
    expect(Object.keys(fromStoredDraft(stored, baseline)!.items)).toEqual(['a']);
  });

  it('reads the old full-copy format as additions and changes only: a stale copy cannot delete items from the file', () => {
    const staleCopy = { items: { a: item('a'), test: item('test') }, icons: {} }; // senza `b`, che nel file c'è
    const draft = fromStoredDraft(staleCopy, { ...baseline, z: item('z') })!;
    expect(Object.keys(draft.items).sort()).toEqual(['a', 'b', 'test', 'z']);
  });

  it('rejects garbage', () => {
    expect(fromStoredDraft(null, baseline)).toBeNull();
    expect(fromStoredDraft('x', baseline)).toBeNull();
    expect(fromStoredDraft({ nothing: true }, baseline)).toBeNull();
  });
});
