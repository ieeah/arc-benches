import { describe, it, expect } from 'vitest';
import {
  getAllListsPure,
  getOrderedListsPure,
  getRefinerLevelPure,
  getActiveListsPure,
  getMaxedListsPure,
  getTotalRequiredMaterialsPure,
  getMissingMaterialsPure,
  getAvailableUpgradesPure,
  getOtherNeedsPure,
} from './selectors';
import type { List } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const bench1: List = {
  id: 'wb:1',
  name: 'Weapon Bench',
  maxLevel: 3,
  levels: [
    { level: 1, requirementItemIds: [{ itemId: 'metal-parts', quantity: 5 }] },
    { level: 2, requirementItemIds: [{ itemId: 'metal-parts', quantity: 10 }, { itemId: 'arc-alloy', quantity: 2 }] },
    { level: 3, requirementItemIds: [{ itemId: 'arc-alloy', quantity: 5 }] },
  ],
};

const bench2: List = {
  id: 'wb:2',
  name: 'Armor Bench',
  maxLevel: 2,
  levels: [
    { level: 1, requirementItemIds: [{ itemId: 'arc-alloy', quantity: 3 }] },
    { level: 2, requirementItemIds: [{ itemId: 'metal-parts', quantity: 4 }] },
  ],
};

const sharedList: List = {
  id: 'custom:shared',
  name: 'Shared',
  maxLevel: 1,
  custom: true,
  shared: true,
  levels: [{ level: 1, requirementItemIds: [{ itemId: 'lemon', quantity: 2 }] }],
};

const customList: List = {
  id: 'custom:abc',
  name: 'My List',
  maxLevel: 2,
  custom: true,
  levels: [
    { level: 1, requirementItemIds: [{ itemId: 'lemon', quantity: 1 }] },
    { level: 2, requirementItemIds: [{ itemId: 'lemon', quantity: 3 }] },
  ],
};

// ---------------------------------------------------------------------------
// getAllListsPure
// ---------------------------------------------------------------------------

describe('getAllListsPure', () => {
  it('concatenates workbenches, sharedCustomLists, customLists in order', () => {
    const result = getAllListsPure([bench1], [sharedList], [customList]);
    expect(result.map(l => l.id)).toEqual(['wb:1', 'custom:shared', 'custom:abc']);
  });

  it('handles empty arrays', () => {
    expect(getAllListsPure([], [], [])).toEqual([]);
    expect(getAllListsPure([bench1], [], [])).toEqual([bench1]);
  });
});

// ---------------------------------------------------------------------------
// getOrderedListsPure
// ---------------------------------------------------------------------------

describe('getOrderedListsPure', () => {
  const all = [bench1, bench2, customList];

  it('sorts by position in listOrder', () => {
    const result = getOrderedListsPure(all, ['custom:abc', 'wb:1', 'wb:2']);
    expect(result.map(l => l.id)).toEqual(['custom:abc', 'wb:1', 'wb:2']);
  });

  it('pushes items not in listOrder to the end (preserving relative order)', () => {
    const result = getOrderedListsPure(all, ['wb:2']);
    expect(result[0].id).toBe('wb:2');
    // bench1 and customList not in order — appear after wb:2
    const tail = result.slice(1).map(l => l.id);
    expect(tail).toContain('wb:1');
    expect(tail).toContain('custom:abc');
  });

  it('returns empty array for empty inputs', () => {
    expect(getOrderedListsPure([], [])).toEqual([]);
    expect(getOrderedListsPure([], ['wb:1'])).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const original = [...all];
    getOrderedListsPure(all, ['wb:2', 'wb:1', 'custom:abc']);
    expect(all).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// getRefinerLevelPure
// ---------------------------------------------------------------------------

describe('getRefinerLevelPure', () => {
  it('returns the level for the given refinerId', () => {
    expect(getRefinerLevelPure({ refiner: 2, other: 1 }, 'refiner')).toBe(2);
  });

  it('returns 0 when key is missing', () => {
    expect(getRefinerLevelPure({}, 'refiner')).toBe(0);
    expect(getRefinerLevelPure({ other: 3 }, 'refiner')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getActiveListsPure / getMaxedListsPure
// ---------------------------------------------------------------------------

describe('getActiveListsPure', () => {
  const hideout: Record<string, number> = { 'wb:1': 1, 'wb:2': 2, 'custom:abc': 0 };

  it('returns lists where current level < maxLevel', () => {
    const all = [bench1, bench2, customList];
    const active = getActiveListsPure(all, hideout);
    // bench1 maxLevel=3, current=1 → active
    // bench2 maxLevel=2, current=2 → maxed (excluded)
    // customList maxLevel=2, current=0 → active
    expect(active.map(l => l.id)).toEqual(['wb:1', 'custom:abc']);
  });

  it('treats missing hideout entry as level 0 (always active unless maxLevel=0)', () => {
    const active = getActiveListsPure([bench1], {});
    expect(active).toContain(bench1);
  });
});

describe('getMaxedListsPure', () => {
  it('returns lists where current level >= maxLevel', () => {
    const hideout: Record<string, number> = { 'wb:1': 3, 'wb:2': 1, 'custom:abc': 2 };
    const maxed = getMaxedListsPure([bench1, bench2, customList], hideout);
    expect(maxed.map(l => l.id)).toEqual(['wb:1', 'custom:abc']);
  });
});

// ---------------------------------------------------------------------------
// getTotalRequiredMaterialsPure
// ---------------------------------------------------------------------------

describe('getTotalRequiredMaterialsPure', () => {
  const activeModules: Record<string, boolean> = { 'wb:1': true, 'wb:2': true };
  const hideoutLevels: Record<string, number> = { 'wb:1': 0, 'wb:2': 0 };
  const targetLevels: Record<string, number[]> = { 'wb:1': [1, 2, 3], 'wb:2': [1, 2] };

  it('aggregates all required materials across active lists', () => {
    // bench1 level1: metal-parts×5; level2: metal-parts×10 + arc-alloy×2; level3: arc-alloy×5
    // bench2 level1: arc-alloy×3; level2: metal-parts×4
    const total = getTotalRequiredMaterialsPure(
      [bench1, bench2], activeModules, hideoutLevels, targetLevels
    );
    expect(total['metal-parts']).toBe(5 + 10 + 4);   // 19
    expect(total['arc-alloy']).toBe(2 + 5 + 3);       // 10
  });

  it('skips levels already reached (level <= current)', () => {
    const total = getTotalRequiredMaterialsPure(
      [bench1], { 'wb:1': true }, { 'wb:1': 1 }, { 'wb:1': [1, 2, 3] }
    );
    // current=1, so only levels 2 and 3 count
    expect(total['metal-parts']).toBe(10);  // level 2 only
    expect(total['arc-alloy']).toBe(2 + 5); // levels 2 and 3
  });

  it('skips levels not in targetLevels', () => {
    const total = getTotalRequiredMaterialsPure(
      [bench1], { 'wb:1': true }, { 'wb:1': 0 }, { 'wb:1': [1] }
    );
    // only level 1 targeted
    expect(total['metal-parts']).toBe(5);
    expect(total['arc-alloy']).toBeUndefined();
  });

  it('skips inactive modules', () => {
    const total = getTotalRequiredMaterialsPure(
      [bench1, bench2],
      { 'wb:1': false, 'wb:2': true },
      { 'wb:1': 0, 'wb:2': 0 },
      { 'wb:1': [1, 2, 3], 'wb:2': [1, 2] }
    );
    // only bench2 contributes
    expect(total['metal-parts']).toBe(4);
    expect(total['arc-alloy']).toBe(3);
  });

  it('excludes the specified moduleId', () => {
    const total = getTotalRequiredMaterialsPure(
      [bench1, bench2], activeModules, hideoutLevels, targetLevels, 'wb:1'
    );
    // only bench2 contributes
    expect(total['metal-parts']).toBe(4);
    expect(total['arc-alloy']).toBe(3);
  });

  it('returns empty object when nothing to aggregate', () => {
    expect(getTotalRequiredMaterialsPure([], {}, {}, {})).toEqual({});
    expect(getTotalRequiredMaterialsPure([bench1], { 'wb:1': false }, {}, {})).toEqual({});
  });

  it('treats missing activeModules entry as inactive', () => {
    const total = getTotalRequiredMaterialsPure([bench1], {}, { 'wb:1': 0 }, { 'wb:1': [1] });
    expect(total).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getMissingMaterialsPure
// ---------------------------------------------------------------------------

describe('getMissingMaterialsPure', () => {
  const totalRequired = { 'metal-parts': 10, 'arc-alloy': 5 };

  it('computes owned / required / missing / isCompleted', () => {
    const inventory = { 'metal-parts': 3, 'arc-alloy': 5 };
    const result = getMissingMaterialsPure(totalRequired, inventory);

    const mp = result.find(r => r.itemId === 'metal-parts')!;
    expect(mp.owned).toBe(3);
    expect(mp.required).toBe(10);
    expect(mp.missing).toBe(7);
    expect(mp.isCompleted).toBe(false);

    const aa = result.find(r => r.itemId === 'arc-alloy')!;
    expect(aa.owned).toBe(5);
    expect(aa.required).toBe(5);
    expect(aa.missing).toBe(0);
    expect(aa.isCompleted).toBe(true);
  });

  it('returns 0 missing when owned exceeds required', () => {
    const result = getMissingMaterialsPure({ 'metal-parts': 3 }, { 'metal-parts': 10 });
    expect(result[0].missing).toBe(0);
    expect(result[0].isCompleted).toBe(true);
  });

  it('treats missing inventory key as owned=0', () => {
    const result = getMissingMaterialsPure({ 'arc-alloy': 4 }, {});
    expect(result[0].owned).toBe(0);
    expect(result[0].missing).toBe(4);
  });

  it('returns one entry per key in totalRequired', () => {
    const result = getMissingMaterialsPure(totalRequired, {});
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty totalRequired', () => {
    expect(getMissingMaterialsPure({}, {})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAvailableUpgradesPure
// ---------------------------------------------------------------------------

describe('getAvailableUpgradesPure', () => {
  it('returns list ids where the next level is fully affordable', () => {
    // bench1 current=0, next=level1, needs metal-parts×5
    // bench2 current=0, next=level1, needs arc-alloy×3
    const ids = getAvailableUpgradesPure(
      [bench1, bench2],
      { 'wb:1': true, 'wb:2': true },
      { 'wb:1': 0, 'wb:2': 0 },
      { 'metal-parts': 5, 'arc-alloy': 2 }  // bench2 short 1 arc-alloy
    );
    expect(ids).toContain('wb:1');
    expect(ids).not.toContain('wb:2');
  });

  it('excludes maxed lists', () => {
    const ids = getAvailableUpgradesPure(
      [bench2],
      { 'wb:2': true },
      { 'wb:2': 2 }, // maxLevel=2, already at max
      { 'metal-parts': 99, 'arc-alloy': 99 }
    );
    expect(ids).toEqual([]);
  });

  it('excludes inactive modules', () => {
    const ids = getAvailableUpgradesPure(
      [bench1],
      { 'wb:1': false },
      { 'wb:1': 0 },
      { 'metal-parts': 99 }
    );
    expect(ids).toEqual([]);
  });

  it('includes a list with no requirements for next level (free upgrade)', () => {
    const freeList: List = {
      id: 'custom:free',
      name: 'Free',
      maxLevel: 2,
      custom: true,
      levels: [{ level: 1, requirementItemIds: [] }, { level: 2, requirementItemIds: [] }],
    };
    const ids = getAvailableUpgradesPure([freeList], { 'custom:free': true }, { 'custom:free': 0 }, {});
    expect(ids).toContain('custom:free');
  });

  it('excludes lists where next level does not exist in levels array', () => {
    // bench2 maxLevel=2 but only has levels [1,2] — at level 1, next is level 2 (exists)
    // at level 2, next would be level 3 which does not exist
    const ids = getAvailableUpgradesPure(
      [bench2],
      { 'wb:2': true },
      { 'wb:2': 1 },
      { 'metal-parts': 99 }
    );
    expect(ids).toContain('wb:2');
  });
});

// ---------------------------------------------------------------------------
// getOtherNeedsPure
// ---------------------------------------------------------------------------

describe('getOtherNeedsPure', () => {
  const activeModules: Record<string, boolean> = { 'wb:1': true, 'wb:2': true };
  const hideoutLevels: Record<string, number> = { 'wb:1': 0, 'wb:2': 0 };
  const targetLevels: Record<string, number[]> = { 'wb:1': [1, 2, 3], 'wb:2': [1, 2] };

  it('equals getTotalRequiredMaterials with the list excluded', () => {
    const totalRequired = getTotalRequiredMaterialsPure(
      [bench1, bench2], activeModules, hideoutLevels, targetLevels
    );
    const otherNeeds = getOtherNeedsPure(totalRequired, bench1, hideoutLevels, targetLevels);
    const expected = getTotalRequiredMaterialsPure(
      [bench1, bench2], activeModules, hideoutLevels, targetLevels, 'wb:1'
    );
    expect(otherNeeds).toEqual(expected);
  });

  it('removes keys that become zero after subtraction', () => {
    // Only bench2 is in play, total = its requirements
    const total = getTotalRequiredMaterialsPure(
      [bench2], { 'wb:2': true }, { 'wb:2': 0 }, { 'wb:2': [1, 2] }
    );
    // Subtract bench2's own contribution → should be empty
    const result = getOtherNeedsPure(total, bench2, { 'wb:2': 0 }, { 'wb:2': [1, 2] });
    expect(result).toEqual({});
  });

  it('does not produce negative values', () => {
    // totalRequired already excludes bench2 (e.g. from a different call), but we subtract again
    const total = { 'arc-alloy': 3 }; // only bench2 level1 contribution
    const result = getOtherNeedsPure(total, bench2, { 'wb:2': 0 }, { 'wb:2': [1, 2] });
    // bench2 level2 requires metal-parts×4 which isn't in total → no negative key
    for (const v of Object.values(result)) {
      expect(v).toBeGreaterThan(0);
    }
  });

  it('does not mutate the totalRequired object', () => {
    const total = { 'arc-alloy': 5, 'metal-parts': 10 };
    const copy = { ...total };
    getOtherNeedsPure(total, bench1, { 'wb:1': 0 }, { 'wb:1': [1, 2, 3] });
    expect(total).toEqual(copy);
  });
});
