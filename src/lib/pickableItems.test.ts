import { describe, it, expect } from 'vitest';
import type { ItemInfo } from '@/types';
import { isPickableItem } from './pickableItems';

const item = (patch: Partial<ItemInfo>): ItemInfo => ({
  id: 'x', name: 'X', description: '', icon: null, rarity: 'Common', item_type: 'Material',
  subcategory: null, value: null, workbench: null, loot_area: null, stack_size: null, ...patch,
});

describe('isPickableItem', () => {
  it('accepts normal items for deliveries and rewards', () => {
    expect(isPickableItem(item({}))).toBe(true);
    expect(isPickableItem(item({}), { includeAll: true })).toBe(true);
  });

  it('excludes non-gameplay types from deliveries but not from rewards', () => {
    for (const item_type of ['Blueprint', 'Cosmetic', 'Outfits', 'Furniture', 'Research', 'Currency']) {
      expect(isPickableItem(item({ item_type }))).toBe(false);
      expect(isPickableItem(item({ item_type }), { includeAll: true })).toBe(true);
    }
  });

  it('always excludes hidden and already chosen items', () => {
    expect(isPickableItem(item({ hidden: true }), { includeAll: true })).toBe(false);
    expect(isPickableItem(item({ id: 'a' }), { includeAll: true, excludedIds: new Set(['a']) })).toBe(false);
  });
});
