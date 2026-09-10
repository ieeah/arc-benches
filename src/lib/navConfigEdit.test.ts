import { describe, it, expect } from 'vitest';
import type { NavConfig } from '@/lib/navTree';
import { ROOT_CONTAINER, containersOf, locate, moveItem, patchItem } from '@/lib/navConfigEdit';

const base: NavConfig = {
  tree: [
    { id: 'a', label: 'A', icon: 'x' },
    { id: 'b', label: 'B', icon: 'x' },
    {
      id: 'cat', label: 'Cat', icon: 'x', category: true,
      children: [
        { id: 'c1', label: 'C1', icon: 'x' },
        { id: 'c2', label: 'C2', icon: 'x' },
      ],
    },
    { id: 'd', label: 'D', icon: 'x' },
  ],
};

describe('containersOf', () => {
  it('groups root ids and category children', () => {
    const c = containersOf(base);
    expect(c[ROOT_CONTAINER]).toEqual(['a', 'b', 'cat', 'd']);
    expect(c.cat).toEqual(['c1', 'c2']);
  });
});

describe('locate', () => {
  it('finds root and nested items', () => {
    expect(locate(base, 'b')).toMatchObject({ container: ROOT_CONTAINER, index: 1 });
    expect(locate(base, 'c2')).toMatchObject({ container: 'cat', index: 1 });
    expect(locate(base, 'nope')).toBeNull();
  });
});

describe('moveItem', () => {
  it('reorders within root', () => {
    const next = moveItem(base, 'd', ROOT_CONTAINER, 0);
    expect(next.tree.map(i => i.id)).toEqual(['d', 'a', 'b', 'cat']);
  });

  it('moves a leaf into a category', () => {
    const next = moveItem(base, 'a', 'cat', 1);
    expect(next.tree.map(i => i.id)).toEqual(['b', 'cat', 'd']);
    expect(next.tree.find(i => i.id === 'cat')!.children!.map(c => c.id)).toEqual(['c1', 'a', 'c2']);
  });

  it('moves a leaf out of a category to root', () => {
    const next = moveItem(base, 'c1', ROOT_CONTAINER, 0);
    expect(next.tree.map(i => i.id)).toEqual(['c1', 'a', 'b', 'cat', 'd']);
    expect(next.tree.find(i => i.id === 'cat')!.children!.map(c => c.id)).toEqual(['c2']);
  });

  it('refuses to move a category into another container', () => {
    const next = moveItem(base, 'cat', 'cat', 0);
    expect(next).toBe(base);
  });

  it('leaves config untouched for unknown id', () => {
    expect(moveItem(base, 'ghost', ROOT_CONTAINER, 0)).toBe(base);
  });
});

describe('patchItem', () => {
  it('updates fields and strips empty label strings', () => {
    const next = patchItem(base, 'a', { label: '', labelKey: 'nav.a' });
    const a = next.tree.find(i => i.id === 'a')!;
    expect(a.label).toBeUndefined();
    expect(a.labelKey).toBe('nav.a');
  });

  it('toggles visibility on a nested item', () => {
    const next = patchItem(base, 'c1', { visibility: 'dev' });
    expect(next.tree.find(i => i.id === 'cat')!.children![0].visibility).toBe('dev');
  });
});
