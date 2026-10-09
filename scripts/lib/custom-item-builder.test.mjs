import { describe, it, expect } from 'vitest';
import { NOTE, inheritPieceIcons, toCatalogItem, toCustomItem } from './custom-item-builder.mjs';

const piece = (name, extra = {}) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''),
  name,
  icon: '',
  review: [NOTE.synthetic, NOTE.rarity, NOTE.icon],
  ...extra,
});

describe('inheritPieceIcons', () => {
  it('points a synthetic outfit piece at its base outfit and updates the icon note', () => {
    const colors = piece('Colors (Ice Giant Color)');
    const toggles = piece('Gas Mask (Banshee Variant)');
    const customItems = { [colors.id]: colors, [toggles.id]: toggles };
    const items = { 'ice-giant-outfit': {}, 'banshee-outfit': {}, [colors.id]: { name: colors.name } };
    expect(inheritPieceIcons(customItems, items).sort()).toEqual([colors.id, toggles.id].sort());
    expect(colors.iconFromItem).toBe('ice-giant-outfit');
    expect(toggles.iconFromItem).toBe('banshee-outfit');
    expect(colors.review).toContain(NOTE.iconFromBase);
    expect(colors.review).not.toContain(NOTE.icon);
    expect(items[colors.id].iconFromItem).toBe('ice-giant-outfit');
  });

  it('leaves alone pieces that already inherit, other items and outfits missing from the catalog', () => {
    const done = piece('Colors (Caposta Color)', { iconFromItem: 'x' });
    const other = { id: 'bar-table', name: 'Bar Table', review: [NOTE.atIcon] };
    const orphan = piece('Colors (Nobody Color)');
    const customItems = { [done.id]: done, [other.id]: other, [orphan.id]: orphan };
    expect(inheritPieceIcons(customItems, { 'caposta-outfit': {} })).toEqual([]);
    expect(done.iconFromItem).toBe('x');
    expect(orphan.iconFromItem).toBeUndefined();
  });

  it('is idempotent', () => {
    const colors = piece('Colors (Caposta Color)');
    const customItems = { [colors.id]: colors };
    const items = { 'caposta-outfit': {} };
    expect(inheritPieceIcons(customItems, items)).toHaveLength(1);
    expect(inheritPieceIcons(customItems, items)).toEqual([]);
  });
});

describe('toCustomItem for synthetic pieces', () => {
  const create = { source: 'synthetic', kind: 'outfit-piece', id: 'colors-caposta-color', name: 'Colors (Caposta Color)', subcategory: 'Outfit Color', piece: 'colors' };

  it('sets iconFromItem when the base outfit is known and keeps the review notes', () => {
    const def = toCustomItem({ ...create, baseItemId: 'caposta-outfit' }, [2, 8, 10]);
    expect(def.iconFromItem).toBe('caposta-outfit');
    expect(def.review).toContain(NOTE.iconFromBase);
    expect(def.review.some((n) => n.startsWith('Compare ai livelli 2, 8, 10'))).toBe(true);
  });

  it('has no inherited icon without a base outfit', () => {
    expect(toCustomItem(create, [2]).iconFromItem).toBeUndefined();
  });

  it('the catalog entry drops the review notes and keeps the inherited icon reference', () => {
    const catalogItem = toCatalogItem(toCustomItem({ ...create, baseItemId: 'caposta-outfit' }, [2]));
    expect(catalogItem.review).toBeUndefined();
    expect(catalogItem.iconFromItem).toBe('caposta-outfit');
    expect(catalogItem.icon).toBeNull();
  });
});
