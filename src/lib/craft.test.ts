import { describe, it, expect } from 'vitest';
import {
  refinerCraftLevel,
  parseWorkbenchRequirement,
  getCraftInfo,
  getItemCraftStatus,
  getBlueprintIdForItem,
  WORKBENCHES_META,
  getWorkbenchName,
  getWorkbenchShortName,
  getWorkbenchBadgeShort,
} from './craft';
import type { ItemInfo } from '@/types';

const makeItem = (
  workbench?: string | null,
  id: string = 'test-item',
  overrides?: Partial<ItemInfo>
): ItemInfo => ({
  id,
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
  ...overrides,
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

describe('parseWorkbenchRequirement', () => {
  it('returns null for empty, whitespace, or invalid workbench strings', () => {
    expect(parseWorkbenchRequirement(undefined)).toBeNull();
    expect(parseWorkbenchRequirement(null)).toBeNull();
    expect(parseWorkbenchRequirement('')).toBeNull();
    expect(parseWorkbenchRequirement('   ')).toBeNull();
    expect(parseWorkbenchRequirement('Loot only')).toBeNull();
  });

  it('parses basic workbench as level 0', () => {
    expect(parseWorkbenchRequirement('Workbench')).toEqual({ workbenchId: 'workbench', levelRequired: 0 });
    expect(parseWorkbenchRequirement('Basic Bench or Med Station 1')).toEqual({ workbenchId: 'workbench', levelRequired: 0 });
    expect(parseWorkbenchRequirement('Weapon Bench 1 or Basic Bench')).toEqual({ workbenchId: 'workbench', levelRequired: 0 });
  });

  it('parses weapon bench / gunsmith across various suffixes', () => {
    expect(parseWorkbenchRequirement('Weapon Bench')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Weapon Bench 1')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Weapon Bench I')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Weapon Bench 2')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 2 });
    expect(parseWorkbenchRequirement('Weapon Bench II')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 2 });
    expect(parseWorkbenchRequirement('Weapon Bench 3')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 3 });
    expect(parseWorkbenchRequirement('Gunsmith')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Gunsmith 1')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Gunsmith II')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 2 });
    expect(parseWorkbenchRequirement('Gunsmith III')).toEqual({ workbenchId: 'weapon-bench', levelRequired: 3 });
  });

  it('parses medical lab / med station', () => {
    expect(parseWorkbenchRequirement('Med Station')).toEqual({ workbenchId: 'med-station', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Med Stations 1')).toEqual({ workbenchId: 'med-station', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Med Station 2')).toEqual({ workbenchId: 'med-station', levelRequired: 2 });
    expect(parseWorkbenchRequirement('Med Station 3')).toEqual({ workbenchId: 'med-station', levelRequired: 3 });
    expect(parseWorkbenchRequirement('Medical Lab I')).toEqual({ workbenchId: 'med-station', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Medical Lab II')).toEqual({ workbenchId: 'med-station', levelRequired: 2 });
  });

  it('parses equipment bench / gear bench', () => {
    expect(parseWorkbenchRequirement('Equipment Bench')).toEqual({ workbenchId: 'equipment-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Equipment Bench 1')).toEqual({ workbenchId: 'equipment-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Gear Bench 3')).toEqual({ workbenchId: 'equipment-bench', levelRequired: 3 });
    expect(parseWorkbenchRequirement('Gear Bench III')).toEqual({ workbenchId: 'equipment-bench', levelRequired: 3 });
  });

  it('parses explosives bench', () => {
    expect(parseWorkbenchRequirement('Explosives Bench')).toEqual({ workbenchId: 'explosives-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Explosive Bench 1')).toEqual({ workbenchId: 'explosives-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Explosives Bench II')).toEqual({ workbenchId: 'explosives-bench', levelRequired: 2 });
    expect(parseWorkbenchRequirement('Explosives Bench 3')).toEqual({ workbenchId: 'explosives-bench', levelRequired: 3 });
    expect(parseWorkbenchRequirement('Explosives Bench III')).toEqual({ workbenchId: 'explosives-bench', levelRequired: 3 });
  });

  it('parses utility bench', () => {
    expect(parseWorkbenchRequirement('Utility Bench')).toEqual({ workbenchId: 'utility-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Utility Bench 1')).toEqual({ workbenchId: 'utility-bench', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Utility Bench 2')).toEqual({ workbenchId: 'utility-bench', levelRequired: 2 });
    expect(parseWorkbenchRequirement('Utility Bench 3')).toEqual({ workbenchId: 'utility-bench', levelRequired: 3 });
    expect(parseWorkbenchRequirement('Utility Station II')).toEqual({ workbenchId: 'utility-bench', levelRequired: 2 });
  });

  it('parses research station / research bench', () => {
    expect(parseWorkbenchRequirement('Research Station')).toEqual({ workbenchId: 'research-station', levelRequired: 1 });
    expect(parseWorkbenchRequirement('Research Station 2')).toEqual({ workbenchId: 'research-station', levelRequired: 2 });
    expect(parseWorkbenchRequirement('Research Station IV')).toEqual({ workbenchId: 'research-station', levelRequired: 4 });
    expect(parseWorkbenchRequirement('Research Bench III')).toEqual({ workbenchId: 'research-station', levelRequired: 3 });
  });
});

describe('getCraftInfo and Overrides', () => {
  it('respects explicit craft_workbench_id and craft_level_required overrides', () => {
    const item = makeItem('Refiner', 'custom-item', {
      craft_workbench_id: 'weapon-bench',
      craft_level_required: 3,
      craft_recipe_id: 'custom-recipe',
    });
    expect(getCraftInfo(item)).toEqual({
      workbenchId: 'weapon-bench',
      levelRequired: 3,
      recipeId: 'custom-recipe',
    });
  });

  it('treats craft_workbench_id = null as not craftable override', () => {
    const item = makeItem('Refiner', 'custom-item', {
      craft_workbench_id: null,
      craft_level_required: null,
    });
    expect(getCraftInfo(item)).toBeNull();
  });

  it('rejects weapon levels > 1 and amplified variants as craftable', () => {
    const lvl1 = makeItem('Weapon Bench 2', 'anvil-i', { item_type: 'Weapon', subcategory: 'Hand Cannon' });
    const lvl2 = makeItem('Weapon Bench 2', 'anvil-ii', { item_type: 'Weapon', subcategory: 'Hand Cannon' });
    const lvl3 = makeItem('Weapon Bench', 'anvil-iii', { item_type: 'Weapon', subcategory: 'Hand Cannon' });
    const amp = makeItem(null, 'amplified-anvil', { item_type: 'Weapon', rarity: 'Amplified' });

    expect(getCraftInfo(lvl1)).not.toBeNull();
    expect(getCraftInfo(lvl2)).toBeNull();
    expect(getCraftInfo(lvl3)).toBeNull();
    expect(getCraftInfo(amp)).toBeNull();
  });
});

describe('getBlueprintIdForItem', () => {
  it('maps craftable item to its blueprint', () => {
    const itemsInfo: Record<string, ItemInfo> = {
      'anvil-i': makeItem('Weapon Bench 2', 'anvil-i', { name: 'Anvil I' }),
      'anvil-recipe': makeItem(null, 'anvil-recipe', {
        name: 'Anvil Blueprint',
        item_type: 'Blueprint',
      }),
    };
    expect(getBlueprintIdForItem('anvil-i', itemsInfo)).toBe('anvil-recipe');
  });
});

describe('getItemCraftStatus', () => {
  const itemsInfo: Record<string, ItemInfo> = {
    'anvil-i': makeItem('Weapon Bench 2', 'anvil-i', { name: 'Anvil I' }),
    'anvil-recipe': makeItem(null, 'anvil-recipe', {
      name: 'Anvil Blueprint',
      item_type: 'Blueprint',
    }),
    'bandage': makeItem('Basic Bench or Med Station 1', 'bandage', { name: 'Bandage' }),
  };

  it('returns not_craftable when item has no workbench', () => {
    const nonCraftable = makeItem(null, 'lemon');
    expect(getItemCraftStatus(nonCraftable, {})).toEqual({
      status: 'not_craftable',
      craftInfo: null,
      currentBenchLevel: 0,
    });
  });

  it('returns craftable for basic workbench item', () => {
    const bandage = itemsInfo['bandage'];
    expect(getItemCraftStatus(bandage, {})).toEqual({
      status: 'craftable',
      craftInfo: {
        workbenchId: 'workbench',
        levelRequired: 0,
        recipeId: null,
      },
      currentBenchLevel: 0,
    });
  });

  describe('level-only mode (default)', () => {
    const anvil = itemsInfo['anvil-i'];

    it('returns needs_level if bench level is lower than required', () => {
      const res = getItemCraftStatus(anvil, { 'weapon-bench': 1 }, {}, 'level-only', itemsInfo);
      expect(res.status).toBe('needs_level');
      expect(res.currentBenchLevel).toBe(1);
    });

    it('returns craftable when bench level is met, even if blueprint is unowned', () => {
      const res = getItemCraftStatus(anvil, { 'weapon-bench': 2 }, { 'anvil-recipe': false }, 'level-only', itemsInfo);
      expect(res.status).toBe('craftable');
      expect(res.currentBenchLevel).toBe(2);
    });
  });

  describe('strict mode', () => {
    const anvil = itemsInfo['anvil-i'];

    it('returns needs_level if bench level is not reached', () => {
      const res = getItemCraftStatus(anvil, { 'weapon-bench': 1 }, { 'anvil-recipe': true }, 'strict', itemsInfo);
      expect(res.status).toBe('needs_level');
    });

    it('returns needs_project if bench level is reached but blueprint is unowned', () => {
      const res = getItemCraftStatus(anvil, { 'weapon-bench': 2 }, {}, 'strict', itemsInfo);
      expect(res.status).toBe('needs_project');
    });

    it('returns craftable only when bench level is reached AND blueprint is owned', () => {
      const res = getItemCraftStatus(anvil, { 'weapon-bench': 2 }, { 'anvil-recipe': true }, 'strict', itemsInfo);
      expect(res.status).toBe('craftable');
    });
  });

  describe('WORKBENCHES_META and localized helpers', () => {
    it('has weapon-bench maxLevel 4 and research-station maxLevel 4', () => {
      expect(WORKBENCHES_META['weapon-bench'].maxLevel).toBe(4);
      expect(WORKBENCHES_META['research-station'].maxLevel).toBe(4);
      expect(WORKBENCHES_META['research-bench'].maxLevel).toBe(4);
      expect(WORKBENCHES_META['refiner'].maxLevel).toBe(3);
    });

    it('getWorkbenchName, getWorkbenchShortName and getWorkbenchBadgeShort return translated strings', () => {
      const mockT = (key: string) => {
        const dict: Record<string, string> = {
          'benches.workbenchNames.weapon-bench': 'Banco delle armi',
          'benches.workbenchShortNames.weapon-bench': 'Armi',
          'benches.workbenchBadgeShort.weapon-bench': 'Armi',
          'benches.workbenchNames.research-station': 'Stazione di Ricerca',
          'benches.workbenchShortNames.research-station': 'Ricerca',
          'benches.workbenchBadgeShort.research-station': 'Ricerca',
          'benches.defaultBench': 'Banco',
          'benches.defaultBenchShort': 'Craft',
        };
        return dict[key] ?? key;
      };

      expect(getWorkbenchName('weapon-bench', mockT)).toBe('Banco delle armi');
      expect(getWorkbenchShortName('weapon-bench', mockT)).toBe('Armi');
      expect(getWorkbenchBadgeShort('weapon-bench', mockT)).toBe('Armi');

      // Aliased research-bench maps to research-station
      expect(getWorkbenchName('research-bench', mockT)).toBe('Stazione di Ricerca');
      expect(getWorkbenchShortName('research-bench', mockT)).toBe('Ricerca');
      expect(getWorkbenchBadgeShort('research-bench', mockT)).toBe('Ricerca');

      // Unknown workbench falls back to default
      expect(getWorkbenchName('unknown-bench', mockT)).toBe('Banco');
      expect(getWorkbenchBadgeShort('unknown-bench', mockT)).toBe('Craft');
    });
  });
});
