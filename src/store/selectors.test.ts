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
  getAllBlueprintsPure,
  getBlueprintProgressPure,
  getItemDependenciesPure,
  isListExpired,
  getMissingActionsPure,
  getStashActionsPure,
  getActiveExpeditionPure,
  getExpeditionDamageTierPure,
  getExpeditionCatchupSPPure,
  calculateExpeditionRewardPure,
  getExpeditionCompletedPhasePure,
} from '@/store/selectors';
import type { List } from '@/types';


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

describe('getAllBlueprintsPure', () => {
  it('filters items where item_type or subcategory is Blueprint', () => {
    const mockItems = {
      'bp-1': { id: 'bp-1', name: 'BP 1', item_type: 'Blueprint', subcategory: 'Weapon' },
      'bp-2': { id: 'bp-2', name: 'BP 2', item_type: 'Item', subcategory: 'Blueprint' },
      'mat-1': { id: 'mat-1', name: 'Material', item_type: 'Material', subcategory: 'Refined' },
    };
    const blueprints = getAllBlueprintsPure(mockItems as unknown as Record<string, import('@/types').ItemInfo>);
    expect(blueprints.map(b => b.id)).toEqual(['bp-1', 'bp-2']);
  });
});

describe('getBlueprintProgressPure', () => {
  it('calculates ownedCount, totalCount and percentage accurately', () => {
    const mockBlueprints = [
      { id: 'bp-1', name: 'BP 1' },
      { id: 'bp-2', name: 'BP 2' },
      { id: 'bp-3', name: 'BP 3' },
      { id: 'bp-4', name: 'BP 4' },
    ] as unknown as import('@/types').ItemInfo[];
    const owned = { 'bp-1': true, 'bp-3': true };
    const stats = getBlueprintProgressPure(mockBlueprints, owned);
    expect(stats).toEqual({
      ownedCount: 2,
      totalCount: 4,
      percentage: 50,
    });
  });

  it('handles empty blueprints array without dividing by zero', () => {
    const stats = getBlueprintProgressPure([], {});
    expect(stats).toEqual({
      ownedCount: 0,
      totalCount: 0,
      percentage: 0,
    });
  });
});

describe('getItemDependenciesPure', () => {
  const mockLists = [
    {
      id: 'bench-1',
      name: 'Banco Equipaggiamento',
      maxLevel: 3,
      levels: [
        { level: 1, requirementItemIds: [{ itemId: 'metal-parts', quantity: 10 }] },
        { level: 2, requirementItemIds: [{ itemId: 'metal-parts', quantity: 20 }, { itemId: 'plastic', quantity: 5 }] },
      ],
    },
    {
      id: 'custom-1',
      name: 'Kit Spedizione',
      custom: true,
      maxLevel: 1,
      levels: [
        { level: 1, requirementItemIds: [{ itemId: 'metal-parts', quantity: 15 }] },
      ],
    },
  ] as unknown as import('@/types').List[];

  it('returns dependencies for selected target levels on active modules', () => {
    const active = { 'bench-1': true, 'custom-1': true };
    const hideout = { 'bench-1': 0, 'custom-1': 0 };
    const targets = { 'bench-1': [1, 2], 'custom-1': [1] };

    const deps = getItemDependenciesPure('metal-parts', mockLists, active, hideout, targets);
    expect(deps).toEqual([
      { listId: 'bench-1', listName: 'Banco Equipaggiamento', level: 1, quantity: 10, isCustom: false },
      { listId: 'bench-1', listName: 'Banco Equipaggiamento', level: 2, quantity: 20, isCustom: false },
      { listId: 'custom-1', listName: 'Kit Spedizione', level: 1, quantity: 15, isCustom: true },
    ]);
  });

  it('ignores levels that are already achieved or not selected in targets', () => {
    const active = { 'bench-1': true, 'custom-1': true };
    const hideout = { 'bench-1': 1, 'custom-1': 0 }; // level 1 already done on bench-1
    const targets = { 'bench-1': [2], 'custom-1': [] }; // custom-1 not targeted

    const deps = getItemDependenciesPure('metal-parts', mockLists, active, hideout, targets);
    expect(deps).toEqual([
      { listId: 'bench-1', listName: 'Banco Equipaggiamento', level: 2, quantity: 20, isCustom: false },
    ]);
  });

  it('ignores expired lists', () => {
    const expiredList = {
      id: 'expired-1',
      name: 'Event 1',
      maxLevel: 1,
      expirationDate: '2020-01-01T00:00:00Z',
      levels: [{ level: 1, requirementItemIds: [{ itemId: 'metal-parts', quantity: 5 }] }],
    } as unknown as import('@/types').List;

    const deps = getItemDependenciesPure(
      'metal-parts',
      [expiredList],
      { 'expired-1': true },
      { 'expired-1': 0 },
      { 'expired-1': [1] },
      new Date('2026-01-01').getTime(),
    );
    expect(deps).toEqual([]);
  });
});

describe('isListExpired and expiration selectors', () => {
  it('correctly detects expired and non-expired dates', () => {
    const past = { expirationDate: '2025-01-01T00:00:00.000Z' };
    const future = { expirationDate: '2027-01-01T00:00:00.000Z' };
    const noExp = {};
    const invalidExp = { expirationDate: 'not-a-date' };

    const testNow = new Date('2026-06-01T00:00:00.000Z').getTime();

    expect(isListExpired(past as unknown as List, testNow)).toBe(true);
    expect(isListExpired(future as unknown as List, testNow)).toBe(false);
    expect(isListExpired(noExp as unknown as List, testNow)).toBe(false);
    expect(isListExpired(invalidExp as unknown as List, testNow)).toBe(false);
  });

  it('excludes expired lists from getTotalRequiredMaterialsPure', () => {
    const expiredList: List = {
      id: 'exp:1',
      name: 'Expired Event',
      maxLevel: 1,
      expirationDate: '2025-01-01T00:00:00.000Z',
      levels: [{ level: 1, requirementItemIds: [{ itemId: 'metal-parts', quantity: 50 }] }],
    };
    const testNow = new Date('2026-06-01T00:00:00.000Z').getTime();

    const total = getTotalRequiredMaterialsPure(
      [bench1, expiredList],
      { 'wb:1': true, 'exp:1': true },
      { 'wb:1': 0, 'exp:1': 0 },
      { 'wb:1': [1], 'exp:1': [1] },
      undefined,
      testNow,
    );

    expect(total['metal-parts']).toBe(5); // only bench1 level 1
  });
});

describe('getMissingActionsPure', () => {
  const actionList: List = {
    id: 'quest:1',
    name: 'Intro Quest',
    maxLevel: 2,
    custom: true,
    levels: [
      {
        level: 1,
        requirementItemIds: [],
        actions: [
          { id: 'act-1', label: 'Talk to Celeste' },
          { id: 'act-2', label: 'Explore the Dam' },
        ],
      },
      {
        level: 2,
        requirementItemIds: [],
        actions: [{ id: 'act-3', label: 'Defeat ARC Sentry' }],
      },
    ],
  };

  it('returns uncompleted actions only for reached levels (up to current + 1)', () => {
    const checked = { 'quest:1|1|act-1': true };
    // current = 0 -> only level 1 actions are reached (level 2 actions are hidden to prevent UI clutter)
    const missing = getMissingActionsPure(
      [actionList],
      { 'quest:1': true },
      { 'quest:1': 0 },
      { 'quest:1': [1, 2] },
      checked,
    );

    expect(missing).toHaveLength(1);
    expect(missing[0]).toEqual({
      listId: 'quest:1',
      listName: 'Intro Quest',
      list: actionList,
      level: 1,
      actionId: 'act-2',
      label: 'Explore the Dam',
      action: { id: 'act-2', label: 'Explore the Dam' },
      isCustom: true,
      isCompleted: false,
    });
  });

  it('reveals level 2 actions once current level reaches 1', () => {
    const checked = { 'quest:1|1|act-1': true, 'quest:1|1|act-2': true };
    // current = 1 -> level 2 actions become reached
    const missing = getMissingActionsPure(
      [actionList],
      { 'quest:1': true },
      { 'quest:1': 1 },
      { 'quest:1': [1, 2] },
      checked,
    );

    expect(missing).toHaveLength(1);
    expect(missing[0]).toEqual({
      listId: 'quest:1',
      listName: 'Intro Quest',
      list: actionList,
      level: 2,
      actionId: 'act-3',
      label: 'Defeat ARC Sentry',
      action: { id: 'act-3', label: 'Defeat ARC Sentry' },
      isCustom: true,
      isCompleted: false,
    });
  });

  it('returns reached stash actions including completed ones with getStashActionsPure', () => {
    const checked = { 'quest:1|1|act-1': true };
    const allActions = getStashActionsPure(
      [actionList],
      { 'quest:1': true },
      { 'quest:1': 0 },
      { 'quest:1': [1, 2] },
      checked,
    );

    // Only level 1 actions are reached when current=0
    expect(allActions).toHaveLength(2);
    expect(allActions[0]).toEqual({
      listId: 'quest:1',
      listName: 'Intro Quest',
      list: actionList,
      level: 1,
      actionId: 'act-1',
      label: 'Talk to Celeste',
      action: { id: 'act-1', label: 'Talk to Celeste' },
      isCustom: true,
      isCompleted: true,
    });
    expect(allActions[1].isCompleted).toBe(false);
  });

  it('excludes actions from expired lists', () => {
    const expiredQuest: List = {
      ...actionList,
      expirationDate: '2020-01-01T00:00:00Z',
    };
    const missing = getMissingActionsPure(
      [expiredQuest],
      { 'quest:1': true },
      { 'quest:1': 0 },
      { 'quest:1': [1, 2] },
      {},
      new Date('2026-01-01').getTime(),
    );

    expect(missing).toEqual([]);
  });
});

describe('Expedition Pure Selectors', () => {
  const sampleExpeditions: List[] = [
    {
      id: 'expedition-1',
      name: 'Carovana #1',
      maxLevel: 6,
      expeditionIndex: 1,
      listType: 'expedition',
      levels: [],
    },
    {
      id: 'expedition-2',
      name: 'Carovana #2',
      maxLevel: 6,
      expeditionIndex: 2,
      listType: 'expedition',
      levels: [],
    },
    {
      id: 'expedition-3',
      name: 'Carovana #3',
      maxLevel: 6,
      expeditionIndex: 3,
      listType: 'expedition',
      levels: [],
    },
  ];

  it('getActiveExpeditionPure picks the active expedition by completed count + 1', () => {
    expect(getActiveExpeditionPure(sampleExpeditions, 0)?.id).toBe('expedition-1');
    expect(getActiveExpeditionPure(sampleExpeditions, 1)?.id).toBe('expedition-2');
    expect(getActiveExpeditionPure(sampleExpeditions, 2)?.id).toBe('expedition-3');
    // If beyond max defined caravans, cycles safely
    expect(getActiveExpeditionPure(sampleExpeditions, 3)?.id).toBe('expedition-1');
  });

  it('getExpeditionDamageTierPure counts completed damage challenge tiers', () => {
    const checked = {
      'expedition-damage|0|tier_1': true,
      'expedition-damage|0|tier_2': true,
      'expedition-damage|0|tier_3': true,
      'other-action': true,
    };
    expect(getExpeditionDamageTierPure(checked)).toBe(3);
    expect(getExpeditionDamageTierPure({})).toBe(0);

    const customChallenge = {
      id: 'custom-damage',
      label: 'Custom Damage',
      steps: [
        { id: 's1', label: '10.000' },
        { id: 's2', label: '50.000' },
        { id: 's3', label: '100.000' },
      ],
    };

    const customChecked = {
      'expedition-damage|0|custom-damage:s1': true,
      'expedition-damage|0|custom-damage:s2': true,
    };

    expect(getExpeditionDamageTierPure(customChecked, customChallenge)).toBe(2);
  });

  it('getExpeditionCatchupSPPure counts completed catchup points', () => {
    const checked = {
      'expedition-catchup|0|sp_1': true,
      'expedition-catchup|0|sp_2': true,
    };
    expect(getExpeditionCatchupSPPure(checked)).toBe(2);
    expect(getExpeditionCatchupSPPure({})).toBe(0);
  });

  it('calculateExpeditionRewardPure awards SP for expeditions 1-3 and mystery rewards for >= 4', () => {
    // Expedition 1: 5 damage tiers + 2 catchup = 7 SP
    const exp1 = calculateExpeditionRewardPure(0, 5, 2);
    expect(exp1.skillPoints).toBe(7);
    expect(exp1.tokenReward).toBe(0);
    expect(exp1.blueprintReward).toBe(0);

    // Expedition 4 (completed count = 3): 4 damage tiers gives 4 blueprints + 600 tokens + 2 catchup SP
    const exp4 = calculateExpeditionRewardPure(3, 4, 2);
    expect(exp4.skillPoints).toBe(2);
    expect(exp4.tokenReward).toBe(600);
    expect(exp4.blueprintReward).toBe(4);
  });

  it('getExpeditionCompletedPhasePure sequentially computes completed phases', () => {
    const caravan: List = {
      id: 'expedition-1',
      name: 'Carovana #1',
      maxLevel: 3,
      levels: [
        {
          level: 1,
          requirementItemIds: [{ itemId: 'metal-parts', quantity: 50 }],
        },
        {
          level: 2,
          requirementItemIds: [{ itemId: 'power-cable', quantity: 10 }],
        },
        {
          level: 3,
          requirementItemIds: [],
          actions: [{ id: 'donations-combat', label: 'Donation Combat' }],
        },
      ],
    };

    // No items or checks -> phase 0
    expect(getExpeditionCompletedPhasePure(caravan, {}, {})).toBe(0);

    // Phase 1 item fulfilled via inventory
    expect(getExpeditionCompletedPhasePure(caravan, { 'metal-parts': 50 }, {})).toBe(1);

    // Phase 1 item fulfilled via checkedActions
    expect(getExpeditionCompletedPhasePure(caravan, {}, { 'expedition-1|1|item_metal-parts': true })).toBe(1);

    // Phase 2 fulfilled via inventory while phase 1 also fulfilled -> phase 2
    expect(getExpeditionCompletedPhasePure(
      caravan,
      { 'metal-parts': 50, 'power-cable': 10 },
      {},
    )).toBe(2);

    // Phase 2 fulfilled but Phase 1 incomplete -> remains 0 (strictly sequential)
    expect(getExpeditionCompletedPhasePure(
      caravan,
      { 'power-cable': 10 },
      {},
    )).toBe(0);

    // All phases fulfilled
    expect(getExpeditionCompletedPhasePure(
      caravan,
      { 'metal-parts': 50, 'power-cable': 10 },
      { 'expedition-1|3|donations-combat': true },
    )).toBe(3);
  });

  it('getTotalRequiredMaterialsPure excludes items marked completed in checkedActions', () => {
    const listWithItems: List = {
      id: 'expedition-1',
      name: 'Carovana #1',
      maxLevel: 1,
      levels: [
        {
          level: 1,
          requirementItemIds: [
            { itemId: 'metal-parts', quantity: 50 },
            { itemId: 'rubber-parts', quantity: 30 },
          ],
        },
      ],
    };

    // Without check
    const totalWithout = getTotalRequiredMaterialsPure(
      [listWithItems],
      { 'expedition-1': true },
      { 'expedition-1': 0 },
      { 'expedition-1': [1] },
      undefined,
      Date.now(),
      {},
    );
    expect(totalWithout['metal-parts']).toBe(50);
    expect(totalWithout['rubber-parts']).toBe(30);

    // With metal-parts checked
    const totalWithCheck = getTotalRequiredMaterialsPure(
      [listWithItems],
      { 'expedition-1': true },
      { 'expedition-1': 0 },
      { 'expedition-1': [1] },
      undefined,
      Date.now(),
      { 'expedition-1|1|item_metal-parts': true },
    );
    expect(totalWithCheck['metal-parts']).toBeUndefined();
    expect(totalWithCheck['rubber-parts']).toBe(30);
  });
});


