import { describe, it, expect } from 'vitest';
import type { List } from '@/types';
import {
  actionWindowLevel, currentLevelOf, hasDeductionConflict, isActionWindowOpen, isCustom, isExpedition, isPass, isProject,
  getBaseLevel, getCascadeLowering, isQuest, isWorkbench, levelActionKeys, maxReachableLevel, parseActionKey,
  pruneOutOfWindowChecks, unmetRequirements, withListType, calculateListProgress,
} from './lists';

const levels = [{ level: 1, requirementItemIds: [] }];
const base = { id: 'x', name: 'X', maxLevel: 1, levels };

describe('list type guards', () => {
  const lists: List[] = [
    { ...base, listType: 'workbench' },
    { ...base, listType: 'expedition', expeditionIndex: 2 },
    { ...base, listType: 'project' },
    { ...base, listType: 'quest', trader: 'shani' },
    { ...base, listType: 'custom', custom: true },
  ];

  it('each guard matches exactly one list type', () => {
    const guards = [isWorkbench, isExpedition, isProject, isQuest, isCustom];
    guards.forEach((guard, i) => {
      expect(lists.map(guard)).toEqual(lists.map((_, j) => i === j));
    });
  });
});

describe('withListType', () => {
  it('adds the required expeditionIndex and drops fields of the previous type', () => {
    const quest: List = { ...base, listType: 'quest', trader: 'shani', prerequisites: ['a'] };
    const exp = withListType(quest, 'expedition', 3);
    expect(exp).toMatchObject({ listType: 'expedition', expeditionIndex: 3, prerequisites: ['a'] });
    expect(exp).not.toHaveProperty('trader');
  });

  it('keeps the expedition index and damage challenge when the type does not change', () => {
    const exp: List = { ...base, listType: 'expedition', expeditionIndex: 5 };
    expect(withListType(exp, 'expedition', 9)).toMatchObject({ expeditionIndex: 5 });
  });

  it('gives a converted pass the default free and premium tracks, and keeps them when it is already a pass', () => {
    const pass = withListType({ ...base, listType: 'project' }, 'pass');
    expect(isPass(pass) && pass.tracks.map(t => t.id)).toEqual(['free', 'premium']);
    expect(isPass(pass) && pass.tracks.map(t => t.locked)).toEqual([undefined, true]);
    const custom: List = { ...base, listType: 'pass', tracks: [{ id: 'legacy', name: 'Legacy' }] };
    expect(withListType(custom, 'pass')).toMatchObject({ tracks: [{ id: 'legacy' }] });
  });

  it('sets custom: true when converting to a custom list', () => {
    expect(withListType({ ...base, listType: 'project' }, 'custom')).toMatchObject({ listType: 'custom', custom: true });
  });

  it('preserves extractionWiped across conversions', () => {
    const listWithWipe: List = { ...base, listType: 'project', extractionWiped: true };
    expect(withListType(listWithWipe, 'custom')).toMatchObject({ extractionWiped: true });

    const listWithoutWipe: List = { ...base, listType: 'project', extractionWiped: false };
    expect(withListType(listWithoutWipe, 'expedition')).toMatchObject({ extractionWiped: false });
  });
});

describe('action window', () => {
  const list: List = {
    id: 'bench', name: 'Bench', listType: 'workbench', maxLevel: 3,
    levels: [
      { level: 1, requirementItemIds: [{ itemId: 'a', quantity: 2 }], actions: [{ id: 'act1', label: 'One' }] },
      {
        level: 2,
        requirementItemIds: [],
        tieredActions: [{ id: 't', label: 'T', steps: [{ id: 's1', label: '1' }, { id: 's2', label: '2' }] }],
      },
      { level: 3, requirementItemIds: [] },
    ],
  };

  it('the window is the level after the current one', () => {
    expect(actionWindowLevel(0)).toBe(1);
    expect(isActionWindowOpen(2, 1)).toBe(true);
    expect(isActionWindowOpen(1, 1)).toBe(false); // già superato
    expect(isActionWindowOpen(3, 1)).toBe(false); // troppo presto
  });

  it('the current level falls back to the base level of the list', () => {
    expect(currentLevelOf(list, { bench: 2 })).toBe(2);
    expect(currentLevelOf(list, {})).toBe(0);
    expect(currentLevelOf({ ...list, levels: [{ level: 1, requirementItemIds: [] }] }, {})).toBe(1);
  });

  it('parses the key of a checked action', () => {
    expect(parseActionKey('bench|2|t:s1')).toEqual({ listId: 'bench', level: 2 });
    expect(parseActionKey('expedition-damage|0|tier_1')).toEqual({ listId: 'expedition-damage', level: 0 });
    expect(parseActionKey('garbage')).toBeNull();
    expect(parseActionKey('bench|x|a')).toBeNull();
  });

  it('prunes the ticks beyond the window and keeps passed levels, the window and keys of unknown lists', () => {
    const checked = { 'bench|1|act1': true, 'bench|2|t:s1': true, 'bench|3|x': true, 'expedition-damage|0|tier_1': true, 'gone|9|a': true };
    expect(pruneOutOfWindowChecks(checked, [list], { bench: 1 })).toEqual({
      'bench|1|act1': true,
      'bench|2|t:s1': true,
      'expedition-damage|0|tier_1': true,
      'gone|9|a': true,
    });
    expect(pruneOutOfWindowChecks(checked, [list], { bench: 0 })).toEqual({
      'bench|1|act1': true,
      'expedition-damage|0|tier_1': true,
      'gone|9|a': true,
    });
  });

  it('lists every key of a level: actions, tiered steps and deliveries', () => {
    expect(levelActionKeys(list, 1)).toEqual(['bench|1|act1', 'bench|1|item_a']);
    expect(levelActionKeys(list, 2)).toEqual(['bench|2|t:s1', 'bench|2|t:s2']);
    expect(levelActionKeys(list, 9)).toEqual([]);
  });

  it('detects a deduction conflict only for owned items that other lists also need', () => {
    expect(hasDeductionConflict(list, 0, 1, { a: 3 }, { a: 1 })).toBe(true);
    expect(hasDeductionConflict(list, 0, 1, { a: 0 }, { a: 1 })).toBe(false);
    expect(hasDeductionConflict(list, 0, 1, { a: 3 }, {})).toBe(false);
    expect(hasDeductionConflict(list, 1, 3, { a: 3 }, { a: 1 })).toBe(false); // il livello 1 è già superato
  });
});

describe('requirements between lists (#87)', () => {
  const lvl = (level: number, requires?: { listId: string; level: number }[], items = 1) => ({
    level,
    requirementItemIds: Array.from({ length: items }, () => ({ itemId: 'x', quantity: 1 })),
    ...(requires ? { requires } : {}),
  });
  // Sheltered Retreat → Outpost (Lvl 1 richiede il progetto al Lvl 2) → Research Station (Lvl N richiede Outpost N)
  const retreat: List = { id: 'retreat', name: 'Retreat', listType: 'project', maxLevel: 2, levels: [lvl(1), lvl(2)] };
  const outpost: List = {
    id: 'outpost', name: 'Outpost', listType: 'workbench', maxLevel: 3,
    levels: [lvl(1, [{ listId: 'retreat', level: 2 }], 0), lvl(2), lvl(3)],
  };
  const research: List = {
    id: 'research', name: 'Research', listType: 'workbench', maxLevel: 3,
    levels: [1, 2, 3].map(n => lvl(n, [{ listId: 'outpost', level: n }])),
  };
  const gun: List = {
    id: 'gun', name: 'Gun', listType: 'workbench', maxLevel: 4,
    levels: [lvl(1), lvl(2), lvl(3), lvl(4, [{ listId: 'outpost', level: 3 }])],
  };
  const all = [retreat, outpost, research, gun];

  it('a first level with a requirement on another list is not unlocked from the start', () => {
    expect(getBaseLevel(outpost)).toBe(0);
    expect(getBaseLevel({ ...outpost, levels: [lvl(1, undefined, 0), lvl(2)] })).toBe(1);
  });

  it('lists the unmet requirements of a level', () => {
    expect(unmetRequirements(research.levels[1], { outpost: 1 })).toEqual([{ listId: 'outpost', level: 2 }]);
    expect(unmetRequirements(research.levels[1], { outpost: 2 })).toEqual([]);
    expect(unmetRequirements(undefined, {})).toEqual([]);
  });

  it('the highest reachable level stops below the first level with an unmet requirement', () => {
    expect(maxReachableLevel(research, { research: 0, outpost: 2 })).toBe(2);
    expect(maxReachableLevel(research, { research: 0, outpost: 0 })).toBe(0);
    expect(maxReachableLevel(research, { research: 0, outpost: 3 })).toBe(3);
    expect(maxReachableLevel(gun, { gun: 1, outpost: 0 })).toBe(3);
    expect(maxReachableLevel(gun, { gun: 1, outpost: 3 })).toBe(4);
  });

  it('lowering a list drops the dependents to just below the first level they can no longer hold, in chain', () => {
    const levels = { retreat: 2, outpost: 3, research: 3, gun: 4 };
    expect(getCascadeLowering(all, levels, 'outpost', 1)).toEqual([
      { listId: 'research', from: 3, to: 1 },
      { listId: 'gun', from: 4, to: 3 },
    ]);
    expect(getCascadeLowering(all, levels, 'retreat', 1).map(s => [s.listId, s.to]).sort()).toEqual([
      ['gun', 3], ['outpost', 0], ['research', 0],
    ]);
  });

  it('there is no cascade when the dependents are already within the new cap, nor in the reverse direction', () => {
    expect(getCascadeLowering(all, { retreat: 2, outpost: 3, research: 1, gun: 2 }, 'outpost', 2)).toEqual([]);
    // Outpost può scendere o salire con Research Station a 0: il vincolo è a senso unico
    expect(getCascadeLowering(all, { retreat: 2, outpost: 3, research: 0, gun: 2 }, 'research', 0)).toEqual([]);
  });
});

describe('calculateListProgress', () => {
  const sampleWorkbench: List = {
    id: 'wb1',
    name: 'Armeria',
    listType: 'workbench',
    maxLevel: 3,
    levels: [
      {
        level: 1,
        requirementItemIds: [
          { itemId: 'metal-parts', quantity: 10 },
          { itemId: 'rubber', quantity: 10 },
        ],
      },
      {
        level: 2,
        requirementItemIds: [
          { itemId: 'steel-cable', quantity: 20 },
        ],
      },
      {
        level: 3,
        requirementItemIds: [
          { itemId: 'circuit-board', quantity: 5 },
        ],
      },
    ],
  };

  it('starts at 0% when current is 0 and inventory is empty', () => {
    const res = calculateListProgress(sampleWorkbench, 0, {});
    expect(res.baseLevel).toBe(0);
    expect(res.maxLevel).toBe(3);
    expect(res.isMaxed).toBe(false);
    expect(res.canUpgrade).toBe(false);
    expect(res.nextLevelPercent).toBe(0);
    expect(res.overallPercent).toBe(0);
    expect(res.segments).toEqual([
      { level: 1, status: 'in-progress', percent: 0, isTarget: true },
      { level: 2, status: 'future', percent: 0, isTarget: false },
      { level: 3, status: 'future', percent: 0, isTarget: false },
    ]);
  });

  it('computes partial micro progress based on collected materials', () => {
    // 5 metal-parts out of 10, 5 rubber out of 10 -> 10/20 = 50%
    const res = calculateListProgress(sampleWorkbench, 0, {
      'metal-parts': 5,
      'rubber': 5,
    });
    expect(res.nextLevelPercent).toBe(50);
    // 50% of level 1 on 3 total levels -> round(50 / 3) = 17%
    expect(res.overallPercent).toBe(17);
    expect(res.segments[0]).toEqual({ level: 1, status: 'in-progress', percent: 50, isTarget: true });
  });

  it('shows ready status and 100% micro when canUpgrade is true', () => {
    const res = calculateListProgress(sampleWorkbench, 0, {
      'metal-parts': 10,
      'rubber': 10,
    }, {}, true);
    expect(res.canUpgrade).toBe(true);
    expect(res.nextLevelPercent).toBe(100);
    // (0*100 + 100)/3 = 33%
    expect(res.overallPercent).toBe(33);
    expect(res.segments[0]).toEqual({ level: 1, status: 'ready', percent: 100, isTarget: true });
  });

  it('marks completed segments when current level is advanced', () => {
    // Current is level 1. Target is level 2 (20 steel-cable). Owned: 10 steel-cable (50%)
    const res = calculateListProgress(sampleWorkbench, 1, {
      'steel-cable': 10,
    });
    expect(res.nextLevelPercent).toBe(50);
    // (1*100 + 50)/3 = 150/3 = 50%
    expect(res.overallPercent).toBe(50);
    expect(res.segments).toEqual([
      { level: 1, status: 'completed', percent: 100, isTarget: false },
      { level: 2, status: 'in-progress', percent: 50, isTarget: true },
      { level: 3, status: 'future', percent: 0, isTarget: false },
    ]);
  });

  it('handles maxed lists correctly with all segments completed and 100% overall', () => {
    const res = calculateListProgress(sampleWorkbench, 3, {});
    expect(res.isMaxed).toBe(true);
    expect(res.overallPercent).toBe(100);
    expect(res.nextLevelPercent).toBe(100);
    expect(res.segments).toEqual([
      { level: 1, status: 'completed', percent: 100, isTarget: false },
      { level: 2, status: 'completed', percent: 100, isTarget: false },
      { level: 3, status: 'completed', percent: 100, isTarget: false },
    ]);
  });

  it('handles lists with baseLevel = 1 (e.g. Scrappy)', () => {
    const scrappyList: List = {
      id: 'scrappy',
      name: 'Scrappy',
      listType: 'workbench',
      maxLevel: 4,
      levels: [
        { level: 1, requirementItemIds: [] },
        { level: 2, requirementItemIds: [{ itemId: 'seeds', quantity: 5 }] },
        { level: 3, requirementItemIds: [{ itemId: 'seeds', quantity: 10 }] },
        { level: 4, requirementItemIds: [{ itemId: 'seeds', quantity: 15 }] },
      ],
    };
    const res = calculateListProgress(scrappyList, 1, { seeds: 5 });
    expect(res.baseLevel).toBe(1);
    expect(res.segments.length).toBe(3); // levels 2, 3, 4
    expect(res.segments.map(s => s.level)).toEqual([2, 3, 4]);
    expect(res.segments[0]).toEqual({ level: 2, status: 'in-progress', percent: 100, isTarget: true });
  });

  it('combines materials and actions weighting', () => {
    const projectWithActions: List = {
      id: 'proj1',
      name: 'Progetto Test',
      listType: 'project',
      maxLevel: 1,
      levels: [
        {
          level: 1,
          requirementItemIds: [{ itemId: 'iron', quantity: 10 }],
          actions: [{ id: 'act1', label: 'Cerca indizio' }],
        },
      ],
    };
    // 100% materials (10/10), 0% actions -> (100% + 0%) / 2 = 50%
    const resPartial = calculateListProgress(projectWithActions, 0, { iron: 10 }, {});
    expect(resPartial.nextLevelPercent).toBe(50);

    // 100% materials and 100% actions -> 100%
    const resFull = calculateListProgress(projectWithActions, 0, { iron: 10 }, { 'proj1|1|act1': true });
    expect(resFull.nextLevelPercent).toBe(100);
  });

  it('tracks requirements of future levels (e.g. level 3 materials owned while at level 1)', () => {
    const multiBench: List = {
      id: 'multi',
      name: 'Multi Bench',
      listType: 'workbench',
      maxLevel: 3,
      levels: [
        { level: 1, requirementItemIds: [{ itemId: 'wood', quantity: 10 }] },
        { level: 2, requirementItemIds: [{ itemId: 'iron', quantity: 20 }] },
        { level: 3, requirementItemIds: [{ itemId: 'gold', quantity: 5 }] },
      ],
    };
    // Siamo al livello 1 (quindi target = livello 2). Possediamo 0 iron per lvl 2, ma abbiamo 5 gold (100% per lvl 3)!
    const res = calculateListProgress(multiBench, 1, { gold: 5 }, {});
    expect(res.segments[0]).toEqual({ level: 1, status: 'completed', percent: 100, isTarget: false });
    expect(res.segments[1]).toEqual({ level: 2, status: 'in-progress', percent: 0, isTarget: true });
    expect(res.segments[2]).toEqual({ level: 3, status: 'in-progress', percent: 100, isTarget: false });
  });

  it('takes delivered items from checkedActions into account', () => {
    const caravanList: List = {
      id: 'exp1',
      name: 'Spedizione 1',
      listType: 'expedition',
      expeditionIndex: 1,
      maxLevel: 1,
      levels: [
        {
          level: 1,
          requirementItemIds: [{ itemId: 'fuel', quantity: 50 }],
        },
      ],
    };
    // Inventory has 0, but fuel was delivered in phase
    const res = calculateListProgress(caravanList, 0, { fuel: 0 }, { 'exp1|1|item_fuel': true });
    expect(res.nextLevelPercent).toBe(100);
  });

  it('allocates shared materials across levels in waterfall order (#138)', () => {
    const offeringList: List = {
      id: 'offering',
      name: "Soul's Offering",
      listType: 'workbench',
      maxLevel: 2,
      levels: [
        { level: 1, requirementItemIds: [{ itemId: 'dead-flowers', quantity: 2 }] },
        { level: 2, requirementItemIds: [{ itemId: 'dead-flowers', quantity: 2 }] },
      ],
    };

    // 2 posseduti: Lvl 1 deve essere 100%, Lvl 2 deve essere 0% (non 50% / 50%)
    const resExact = calculateListProgress(offeringList, 0, { 'dead-flowers': 2 });
    expect(resExact.segments[0]).toEqual({ level: 1, status: 'in-progress', percent: 100, isTarget: true });
    expect(resExact.segments[1]).toEqual({ level: 2, status: 'future', percent: 0, isTarget: false });

    // 3 posseduti: Lvl 1 a 100% (2 consumati), Lvl 2 a 50% (1 rimasto / 2 richiesti)
    const resPartial = calculateListProgress(offeringList, 0, { 'dead-flowers': 3 });
    expect(resPartial.segments[0]).toEqual({ level: 1, status: 'in-progress', percent: 100, isTarget: true });
    expect(resPartial.segments[1]).toEqual({ level: 2, status: 'in-progress', percent: 50, isTarget: false });

    // Se Lvl 1 ha già consegnato dead-flowers tramite checkedActions, i 2 fiori dell'inventario
    // scalano interamente su Lvl 2!
    const resDelivered = calculateListProgress(
      offeringList,
      0,
      { 'dead-flowers': 2 },
      { 'offering|1|item_dead-flowers': true }
    );
    expect(resDelivered.segments[0]).toEqual({ level: 1, status: 'in-progress', percent: 100, isTarget: true });
    expect(resDelivered.segments[1]).toEqual({ level: 2, status: 'in-progress', percent: 100, isTarget: false });
  });
});
