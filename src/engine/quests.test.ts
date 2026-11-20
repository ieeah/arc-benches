import { describe, it, expect } from 'vitest';
import questsData from '@/data/quests.json';
import type { QuestList } from '@/types';
import {
  aggregateQuestRequirementsAndRewards,
  filterQuests,
  getAvailableQuests,
  getPrerequisiteQuests,
  getQuestById,
  getQuestChain,
  getUnlockedNextQuests,
} from './quests';

function makeQuest(overrides: Partial<QuestList> & { id: string }): QuestList {
  return {
    name: overrides.id,
    listType: 'quest',
    maxLevel: 1,
    levels: [
      {
        level: 1,
        requirementItemIds: [],
        rewards: [],
      },
    ],
    ...overrides,
  };
}

describe('Quest Engine (Issue #177) — synthetic fixtures', () => {
  const qRoot1 = makeQuest({
    id: 'root-1',
    name: 'First Step',
    trader: 'celeste',
    translations: { it: { name: 'Primo Passo' } },
    levels: [
      {
        level: 1,
        requirementItemIds: [{ itemId: 'metal-parts', quantity: 5 }],
        rewards: [{ itemId: 'coins', quantity: 100 }],
      },
    ],
  });

  const qRoot2 = makeQuest({
    id: 'root-2',
    name: 'Side Step',
    trader: 'shani',
    levels: [
      {
        level: 1,
        requirementItemIds: [{ itemId: 'wires', quantity: 2 }],
        rewards: [{ itemId: 'xp', quantity: 50 }],
      },
    ],
  });

  const qMid = makeQuest({
    id: 'mid-1',
    name: 'Middle Quest',
    trader: 'celeste',
    prerequisites: ['root-1'],
    levels: [
      {
        level: 1,
        requirementItemIds: [
          { itemId: 'metal-parts', quantity: 3 },
          { itemId: 'spring', quantity: 2 },
        ],
        rewards: [
          { itemId: 'coins', quantity: 200 },
          { itemId: 'duct-tape', quantity: 4 },
        ],
      },
    ],
  });

  const qDiamond = makeQuest({
    id: 'diamond-end',
    name: 'Final Convergence',
    trader: 'apollo',
    prerequisites: ['mid-1', 'root-2'],
    levels: [
      {
        level: 1,
        requirementItemIds: [],
        actions: [
          {
            id: 'act-1',
            label: 'Deliver',
            rewards: [{ itemId: 'xp', quantity: 150 }],
          },
        ],
        rewards: [{ itemId: 'coins', quantity: 500 }],
      },
    ],
  });

  const quests: QuestList[] = [qRoot1, qRoot2, qMid, qDiamond];

  it('getQuestById finds existing quests and returns undefined otherwise', () => {
    expect(getQuestById(quests, 'mid-1')).toBe(qMid);
    expect(getQuestById(quests, 'unknown')).toBeUndefined();
    expect(getQuestById(quests, '')).toBeUndefined();
  });

  it('getPrerequisiteQuests returns direct prerequisites and ignores dangling IDs', () => {
    expect(getPrerequisiteQuests(quests, 'root-1')).toEqual([]);
    expect(getPrerequisiteQuests(quests, 'mid-1')).toEqual([qRoot1]);
    expect(getPrerequisiteQuests(quests, 'diamond-end')).toEqual([qMid, qRoot2]);
    expect(getPrerequisiteQuests(quests, 'missing')).toEqual([]);

    const withDangling = [
      qRoot1,
      makeQuest({ id: 'child', prerequisites: ['root-1', 'non-existent', 'root-1'] }),
    ];
    expect(getPrerequisiteQuests(withDangling, 'child')).toEqual([qRoot1]);
  });

  it('getUnlockedNextQuests returns quests that directly depend on questId', () => {
    expect(getUnlockedNextQuests(quests, 'root-1')).toEqual([qMid]);
    expect(getUnlockedNextQuests(quests, 'root-2')).toEqual([qDiamond]);
    expect(getUnlockedNextQuests(quests, 'diamond-end')).toEqual([]);
    expect(getUnlockedNextQuests(quests, '')).toEqual([]);
  });

  it('getAvailableQuests returns uncompleted quests whose prerequisites are all completed', () => {
    expect(getAvailableQuests(quests, []).map((q) => q.id)).toEqual(['root-1', 'root-2']);
    expect(getAvailableQuests(quests, new Set(['root-1'])).map((q) => q.id)).toEqual([
      'root-2',
      'mid-1',
    ]);
    expect(getAvailableQuests(quests, ['root-1', 'mid-1']).map((q) => q.id)).toEqual(['root-2']);
    expect(getAvailableQuests(quests, ['root-1', 'root-2', 'mid-1']).map((q) => q.id)).toEqual([
      'diamond-end',
    ]);
    expect(
      getAvailableQuests(quests, ['root-1', 'root-2', 'mid-1', 'diamond-end']),
    ).toEqual([]);
  });

  it('filterQuests filters by trader, searchQuery, and optional getName', () => {
    expect(filterQuests(quests)).toHaveLength(4);
    expect(filterQuests(quests, { trader: 'celeste' }).map((q) => q.id)).toEqual([
      'root-1',
      'mid-1',
    ]);
    expect(filterQuests(quests, { searchQuery: '  step ' }).map((q) => q.id)).toEqual([
      'root-1',
      'root-2',
    ]);
    expect(
      filterQuests(quests, {
        trader: 'celeste',
        searchQuery: 'primo',
        getName: (q) => q.translations?.it?.name ?? q.name,
      }).map((q) => q.id),
    ).toEqual(['root-1']);
  });

  it('aggregateQuestRequirementsAndRewards sums requirements and rewards across quests without duplicates', () => {
    const agg = aggregateQuestRequirementsAndRewards(quests, [
      'root-1',
      'mid-1',
      'diamond-end',
      'root-1',
      'unknown',
    ]);

    expect(agg.requirements).toEqual([
      { itemId: 'metal-parts', quantity: 8 },
      { itemId: 'spring', quantity: 2 },
    ]);
    expect(agg.rewards).toEqual([
      { itemId: 'coins', quantity: 800 },
      { itemId: 'duct-tape', quantity: 4 },
      { itemId: 'xp', quantity: 150 },
    ]);
  });

  it('getQuestChain reconstructs prerequisite DAG in topological order without duplicates', () => {
    expect(getQuestChain(quests, 'unknown')).toEqual([]);
    expect(getQuestChain(quests, 'root-1').map((q) => q.id)).toEqual(['root-1']);

    const chain = getQuestChain(quests, 'diamond-end');
    const ids = chain.map((q) => q.id);

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(ids[ids.length - 1]).toBe('diamond-end');
    expect(ids.indexOf('root-1')).toBeLessThan(ids.indexOf('mid-1'));
    expect(ids.indexOf('mid-1')).toBeLessThan(ids.indexOf('diamond-end'));
    expect(ids.indexOf('root-2')).toBeLessThan(ids.indexOf('diamond-end'));
  });

  it('getQuestChain terminates safely on cyclic prerequisites', () => {
    const cyclic: QuestList[] = [
      makeQuest({ id: 'a', prerequisites: ['b'] }),
      makeQuest({ id: 'b', prerequisites: ['a'] }),
    ];
    const chain = getQuestChain(cyclic, 'a');
    expect(chain.map((q) => q.id)).toEqual(['b', 'a']);
  });
});

describe('Quest Engine (Issue #177) — real quests.json (123 quests)', () => {
  const realQuests = questsData.lists as QuestList[];

  it('loads all 123 quests', () => {
    expect(realQuests).toHaveLength(123);
  });

  it('identifies the 3 root quests when no quests are completed', () => {
    const available = getAvailableQuests(realQuests, []);
    expect(available.map((q) => q.id)).toEqual([
      'nothing-ventured',
      'picking-up-the-pieces',
      'the-first-nomads',
    ]);
  });

  it('navigates prerequisites and unlocked next quests on real graph', () => {
    const quest = getQuestById(realQuests, 'a-bad-feeling');
    expect(quest).toBeDefined();
    expect(quest?.trader).toBe('celeste');

    const prereqs = getPrerequisiteQuests(realQuests, 'a-bad-feeling');
    expect(prereqs.map((q) => q.id)).toEqual(['off-the-raider']);

    const nextFromRoot = getUnlockedNextQuests(realQuests, 'picking-up-the-pieces');
    expect(nextFromRoot.length).toBeGreaterThan(0);
    for (const next of nextFromRoot) {
      expect(next.prerequisites).toContain('picking-up-the-pieces');
    }
  });

  it('filters real quests by trader and localized Italian name', () => {
    const celesteQuests = filterQuests(realQuests, { trader: 'celeste' });
    expect(celesteQuests.length).toBeGreaterThan(0);
    expect(celesteQuests.every((q) => q.trader === 'celeste')).toBe(true);

    const itMatches = filterQuests(realQuests, {
      searchQuery: 'raccolto equilibrato',
      getName: (q) => q.translations?.it?.name ?? q.name,
    });
    expect(itMatches.map((q) => q.id)).toEqual(['a-balanced-harvest']);
  });

  it('builds a valid topological quest chain for multi-prerequisite quest back-on-top', () => {
    const chain = getQuestChain(realQuests, 'back-on-top');
    const ids = chain.map((q) => q.id);

    expect(ids.length).toBeGreaterThan(3);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[ids.length - 1]).toBe('back-on-top');

    const indexById = new Map(ids.map((id, idx) => [id, idx]));
    for (const quest of chain) {
      const questIdx = indexById.get(quest.id)!;
      for (const prereqId of quest.prerequisites ?? []) {
        const prereqIdx = indexById.get(prereqId);
        expect(prereqIdx).toBeDefined();
        expect(prereqIdx!).toBeLessThan(questIdx);
      }
    }

    const agg = aggregateQuestRequirementsAndRewards(realQuests, ids);
    expect(agg.rewards.length).toBeGreaterThan(0);
    expect(new Set(agg.rewards.map((r) => r.itemId)).size).toBe(agg.rewards.length);
    expect(new Set(agg.requirements.map((r) => r.itemId)).size).toBe(agg.requirements.length);
  });
});
