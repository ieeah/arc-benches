import { describe, it, expect } from 'vitest';
import {
  getAllDesignsPure,
  getDesignProgressPure,
  getAllStencilsPure,
  getStencilProgressPure,
  getGlobalCollectionsProgressPure,
} from '@/store/selectors';
import {
  getBlueprintCategory,
  getBlueprintWorkbench,
  getFurnitureCategory,
} from '@/lib/collections';
import type { ItemInfo } from '@/types';

describe('collections selectors & helpers', () => {
  const mockItems: Record<string, ItemInfo> = {
    'anvil-i': {
      id: 'anvil-i',
      name: 'Anvil I',
      item_type: 'Weapon',
      subcategory: 'Hand Cannon',
      workbench: 'Weapon Bench 2',
      description: '',
      icon: null,
      rarity: 'Rare',
      value: null,
      loot_area: null,
      stack_size: null,
    },
    'anvil-recipe': {
      id: 'anvil-recipe',
      name: 'Anvil Blueprint',
      item_type: 'Blueprint',
      subcategory: 'Blueprint',
      unlocks_item_id: 'anvil-i',
      workbench: null,
      description: '',
      icon: null,
      rarity: 'Rare',
      value: null,
      loot_area: null,
      stack_size: null,
    },
    'alpine-wardrobe': {
      id: 'alpine-wardrobe',
      name: 'Alpine Wardrobe',
      item_type: 'Furniture',
      subcategory: 'Storage',
      workbench: null,
      description: '',
      icon: null,
      rarity: 'Epic',
      value: null,
      loot_area: null,
      stack_size: null,
      translations: { it: { name: 'Guardaroba alpino' } },
    },
    'alpine-wardrobe-design': {
      id: 'alpine-wardrobe-design',
      name: 'Alpine Wardrobe Design',
      item_type: 'Design',
      subcategory: null,
      unlocks_item_id: 'alpine-wardrobe',
      workbench: null,
      description: '',
      icon: null,
      rarity: 'Epic',
      value: null,
      loot_area: null,
      stack_size: null,
    },
    'bulwark-stencil': {
      id: 'bulwark-stencil',
      name: 'Bulwark Stencil',
      item_type: 'Stencil',
      subcategory: null,
      workbench: null,
      description: '',
      icon: null,
      rarity: 'Legendary',
      value: null,
      loot_area: null,
      stack_size: null,
    },
  };

  it('selects all designs and calculates progress', () => {
    const designs = getAllDesignsPure(mockItems);
    expect(designs).toHaveLength(1);
    expect(designs[0].id).toBe('alpine-wardrobe-design');

    const emptyProgress = getDesignProgressPure(designs, {});
    expect(emptyProgress).toEqual({ ownedCount: 0, totalCount: 1, percentage: 0 });

    const ownedProgress = getDesignProgressPure(designs, { 'alpine-wardrobe-design': true });
    expect(ownedProgress).toEqual({ ownedCount: 1, totalCount: 1, percentage: 100 });
  });

  it('selects all stencils and calculates progress', () => {
    const stencils = getAllStencilsPure(mockItems);
    expect(stencils).toHaveLength(1);
    expect(stencils[0].id).toBe('bulwark-stencil');

    const emptyProgress = getStencilProgressPure(stencils, {});
    expect(emptyProgress).toEqual({ ownedCount: 0, totalCount: 1, percentage: 0 });

    const ownedProgress = getStencilProgressPure(stencils, { 'bulwark-stencil': true });
    expect(ownedProgress).toEqual({ ownedCount: 1, totalCount: 1, percentage: 100 });
  });

  it('calculates global collections progress across all 3 registries', () => {
    const globalProgress = getGlobalCollectionsProgressPure(
      mockItems,
      { 'anvil-recipe': true },
      { 'alpine-wardrobe-design': true },
      {}
    );

    expect(globalProgress.blueprints.ownedCount).toBe(1);
    expect(globalProgress.designs.ownedCount).toBe(1);
    expect(globalProgress.stencils.ownedCount).toBe(0);
    expect(globalProgress.total).toEqual({
      ownedCount: 2,
      totalCount: 3,
      percentage: 67,
    });
  });

  it('derives blueprint category and workbench via unlocks_item_id or target item', () => {
    const bp = mockItems['anvil-recipe'];
    expect(getBlueprintCategory(bp, mockItems)).toBe('weapon');
    expect(getBlueprintWorkbench(bp, mockItems)).toBe('weapon-bench');

    const grenadeBp: ItemInfo = {
      id: 'blaze-grenade-blueprint',
      name: 'Blaze Grenade Blueprint',
      item_type: 'Blueprint',
      subcategory: null,
      workbench: 'Explosives Bench 3',
      description: '',
      icon: null,
      rarity: 'Epic',
      value: null,
      loot_area: null,
      stack_size: null,
    };
    expect(getBlueprintCategory(grenadeBp, {})).toBe('explosive');

    const medBp: ItemInfo = {
      id: 'defibrillator-recipe',
      name: 'Defibrillator Blueprint',
      item_type: 'Blueprint',
      subcategory: null,
      workbench: 'Med Station 3',
      description: '',
      icon: null,
      rarity: 'Rare',
      value: null,
      loot_area: null,
      stack_size: null,
    };
    expect(getBlueprintCategory(medBp, {})).toBe('medical');
  });

  it('derives furniture category for designs', () => {
    const design = mockItems['alpine-wardrobe-design'];
    expect(getFurnitureCategory(design, mockItems)).toBe('storage');
  });
});
