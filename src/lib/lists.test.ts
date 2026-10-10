import { describe, it, expect } from 'vitest';
import type { List } from '@/types';
import {
  actionWindowLevel, currentLevelOf, hasDeductionConflict, isActionWindowOpen, isCustom, isExpedition, isPass, isProject,
  isQuest, isWorkbench, levelActionKeys, parseActionKey, pruneOutOfWindowChecks, withListType,
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
