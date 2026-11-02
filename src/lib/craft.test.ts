import { describe, it, expect } from 'vitest';
import { refinerCraftLevel } from './craft';
import type { ItemInfo } from '@/types';

const makeItem = (workbench?: string | null): ItemInfo => ({
  id: 'test-item',
  name: 'Test Item',
  description: '',
  icon: null,
  rarity: 'Common',
  item_type: 'Material',
  subcategory: null,
  value: 0,
  workbench: workbench ?? null,
  loot_area: null,
  stack_size: null,
});

describe('refinerCraftLevel', () => {
  it('returns null for missing, non-refiner or null workbench', () => {
    expect(refinerCraftLevel(undefined)).toBeNull();
    expect(refinerCraftLevel(makeItem(null))).toBeNull();
    expect(refinerCraftLevel(makeItem('Weapon Bench'))).toBeNull();
    expect(refinerCraftLevel(makeItem('Gunsmith III'))).toBeNull();
  });

  it('correctly parses Refiner level 1 variants', () => {
    expect(refinerCraftLevel(makeItem('Refiner'))).toBe(1);
    expect(refinerCraftLevel(makeItem('refiner'))).toBe(1);
    expect(refinerCraftLevel(makeItem('Refiner I'))).toBe(1);
    expect(refinerCraftLevel(makeItem('Refiner 1'))).toBe(1);
  });

  it('correctly parses Refiner level 2 variants', () => {
    expect(refinerCraftLevel(makeItem('Refiner II'))).toBe(2);
    expect(refinerCraftLevel(makeItem('refiner ii'))).toBe(2);
    expect(refinerCraftLevel(makeItem('Refiner 2'))).toBe(2);
  });

  it('correctly parses Refiner level 3 variants', () => {
    expect(refinerCraftLevel(makeItem('Refiner III'))).toBe(3);
    expect(refinerCraftLevel(makeItem('refiner iii'))).toBe(3);
    expect(refinerCraftLevel(makeItem('Refiner 3'))).toBe(3);
  });

  it('correctly parses higher levels if present', () => {
    expect(refinerCraftLevel(makeItem('Refiner IV'))).toBe(4);
    expect(refinerCraftLevel(makeItem('Refiner V'))).toBe(5);
  });
});
