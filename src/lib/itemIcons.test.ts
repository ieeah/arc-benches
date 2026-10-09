import { describe, it, expect } from 'vitest';
import type { ItemInfo } from '@/types';
import { applyIconFallbacks } from './itemIcons';

const item = (id: string, patch: Partial<ItemInfo> = {}): ItemInfo => ({
  id, name: id, description: '', icon: null, rarity: 'Common', item_type: 'Cosmetic',
  subcategory: 'Outfit Color', value: null, workbench: null, loot_area: null, stack_size: null, ...patch,
});

describe('applyIconFallbacks', () => {
  it('keeps an item own icon', () => {
    const catalog = { a: item('a', { icon: 'icons/items/a.webp' }) };
    applyIconFallbacks(catalog);
    expect(catalog.a.icon).toBe('icons/items/a.webp');
  });

  it('lets a piece use the icon of its base outfit', () => {
    const catalog = {
      'caposta-outfit': item('caposta-outfit', { icon: 'icons/items/caposta-outfit.webp', item_type: 'Outfits', subcategory: 'Outfit' }),
      'colors-caposta-color': item('colors-caposta-color', { iconFromItem: 'caposta-outfit' }),
    };
    applyIconFallbacks(catalog);
    expect(catalog['colors-caposta-color'].icon).toBe('icons/items/caposta-outfit.webp');
  });

  it('falls back to the subcategory icon when the base item is unknown or has no icon of its own', () => {
    const catalog = {
      base: item('base'),
      orphan: item('orphan', { iconFromItem: 'nope' }),
      piece: item('piece', { iconFromItem: 'base' }),
    };
    applyIconFallbacks(catalog);
    for (const id of ['orphan', 'piece']) expect(catalog[id as 'orphan' | 'piece'].icon).toContain('outfit-color.webp');
  });

  it('does not chain through another fallback: the inherited icon is the other item own icon', () => {
    const catalog = {
      outfit: item('outfit', { icon: 'icons/items/outfit.webp' }),
      middle: item('middle', { iconFromItem: 'outfit' }),
      leaf: item('leaf', { iconFromItem: 'middle' }),
    };
    applyIconFallbacks(catalog);
    expect(catalog.middle.icon).toBe('icons/items/outfit.webp');
    expect(catalog.leaf.icon).toContain('outfit-color.webp');
  });
});
