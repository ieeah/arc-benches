import { describe, it, expect } from 'vitest';
import type { List } from '@/types';
import { isCustom, isExpedition, isPass, isProject, isQuest, isWorkbench, withListType } from './lists';

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
    const custom: List = { ...base, listType: 'pass', tracks: [{ id: 'legacy', name: 'Legacy' }] };
    expect(withListType(custom, 'pass')).toMatchObject({ tracks: [{ id: 'legacy' }] });
  });

  it('sets custom: true when converting to a custom list', () => {
    expect(withListType({ ...base, listType: 'project' }, 'custom')).toMatchObject({ listType: 'custom', custom: true });
  });
});
