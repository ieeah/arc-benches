import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ItemInfo } from '@/types';
import {
  getBaseItem,
  getBaseItemsMap,
  isBaseItem,
  isVariantItem,
  getBaseItemForVariant,
  baseItemToItemInfo,
  getSuggestedVariants,
  getProducedItemForBlueprint,
  saveItemVariantsDraft,
  clearItemVariantsDraft,
  hasItemVariantsDraft,
  type BaseItemDefinition,
} from './baseItems';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

const mockLocalStorage = new MockStorage();
vi.stubGlobal('localStorage', mockLocalStorage);

const mockItem = (id: string, name: string, type = 'Weapon'): ItemInfo => ({
  id,
  name,
  description: '',
  icon: 'icons/test.webp',
  rarity: 'Common',
  item_type: type,
  subcategory: null,
  value: 100,
  workbench: null,
  loot_area: null,
  stack_size: 1,
  translations: {},
});

describe('baseItems logic', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    clearItemVariantsDraft();
  });

  it('loads seed base items', () => {
    const map = getBaseItemsMap();
    expect(map['anvil']).toBeDefined();
    expect(map['anvil'].name).toBe('Anvil');
    expect(map['anvil'].variantItemIds).toContain('anvil-i');
    expect(map['anvil'].variantItemIds).toContain('anvil-iv');
    expect(map['amplification-module']?.rarity).toBe('Amplified');
  });

  it('identifies base items and variant items and resolves their base item', () => {
    expect(isBaseItem('anvil')).toBe(true);
    expect(isBaseItem('amplification-module')).toBe(true);
    expect(isBaseItem('anvil-i')).toBe(false);
    expect(isBaseItem('dolabra')).toBe(false);

    expect(isVariantItem('anvil-i')).toBe(true);
    expect(isVariantItem('anvil-iv')).toBe(true);
    expect(isVariantItem('amplified-anvil')).toBe(true);
    expect(isVariantItem('non-existent-item')).toBe(false);

    const base = getBaseItemForVariant('anvil-ii');
    expect(base?.id).toBe('anvil');
    expect(base?.name).toBe('Anvil');
  });

  it('converts BaseItemDefinition into a valid ItemInfo', () => {
    const base: BaseItemDefinition = {
      id: 'custom-weapon',
      name: 'Custom Weapon',
      item_type: 'Weapon',
      subcategory: 'Pistol',
      rarity: 'Rare',
      icon: 'icons/custom.webp',
      variantItemIds: ['custom-weapon-i'],
    };

    const item = baseItemToItemInfo(base);
    expect(item.id).toBe('custom-weapon');
    expect(item.name).toBe('Custom Weapon');
    expect(item.item_type).toBe('Weapon');
    expect(item.subcategory).toBe('Pistol');
    expect(item.rarity).toBe('Rare');
  });

  it('suggests candidate variants from catalog matching base name or id', () => {
    const catalog = [
      mockItem('anvil-i', 'Anvil I'),
      mockItem('anvil-ii', 'Anvil II'),
      mockItem('amplified-anvil', 'Amplified Anvil'),
      mockItem('bettina-i', 'Bettina I'),
      mockItem('random-scrap', 'Random Scrap', 'Material'),
    ];

    const assigned = new Set(['anvil-i']);
    const suggestions = getSuggestedVariants('Anvil', catalog, assigned);

    expect(suggestions.map((s) => s.id)).toEqual(['anvil-ii', 'amplified-anvil']);
    expect(suggestions.find((s) => s.id === 'anvil-i')).toBeUndefined();
    expect(suggestions.find((s) => s.id === 'bettina-i')).toBeUndefined();
  });

  it('supports local draft saving and clearing', () => {
    expect(hasItemVariantsDraft()).toBe(false);

    saveItemVariantsDraft({
      baseItems: {
        test: {
          id: 'test',
          name: 'Test',
          item_type: 'Weapon',
          variantItemIds: ['test-1'],
        },
      },
    });

    expect(hasItemVariantsDraft()).toBe(true);
    expect(getBaseItem('test')).toBeDefined();

    clearItemVariantsDraft();
    expect(hasItemVariantsDraft()).toBe(false);
    expect(getBaseItem('test')).toBeUndefined();
  });

  it('resolves produced item for a blueprint bidirectionally', () => {
    const itemsMap: Record<string, ItemInfo> = {
      'anvil-i': mockItem('anvil-i', 'Anvil I'),
      'anvil-recipe': mockItem('anvil-recipe', 'Anvil Blueprint', 'Blueprint'),
      'advanced-camera': mockItem('advanced-camera', 'Advanced Camera', 'Tool'),
      'advanced-camera-blueprint': mockItem('advanced-camera-blueprint', 'Advanced Camera Blueprint', 'Blueprint'),
    };

    // Via baseItem.blueprintItemId
    const anvilProduced = getProducedItemForBlueprint('anvil-recipe', itemsMap);
    expect(anvilProduced?.id).toBe('anvil-i');

    // Via ID stripping
    const cameraProduced = getProducedItemForBlueprint('advanced-camera-blueprint', itemsMap);
    expect(cameraProduced?.id).toBe('advanced-camera');
  });
});
