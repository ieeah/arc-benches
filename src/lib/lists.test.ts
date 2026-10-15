import { describe, it, expect } from 'vitest';
import type { List } from '@/types';
import {
  actionWindowLevel, currentLevelOf, hasDeductionConflict, isActionWindowOpen, isCustom, isExpedition, isPass, isProject,
  getBaseLevel, getCascadeLowering, isQuest, isWorkbench, levelActionKeys, maxReachableLevel, parseActionKey,
  pruneOutOfWindowChecks, unmetRequirements, withListType,
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
