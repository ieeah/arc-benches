import { describe, it, expect } from 'vitest';
import type { ItemInfo, List, PassList } from '@/types';
import { findListIssues, reviewNotes } from './listIssues';

const item = (id: string): ItemInfo => ({
  id, name: id.toUpperCase(), description: '', icon: null, rarity: 'Common', item_type: 'Material',
  subcategory: null, value: null, workbench: null, loot_area: null, stack_size: null,
});

const catalog = { known: item('known'), reviewed: item('reviewed') };
const level = (n: number, extra: Partial<List['levels'][number]> = {}) => ({ level: n, requirementItemIds: [], ...extra });

describe('findListIssues', () => {
  it('flags items missing from the catalog, grouped with the levels where they appear, as errors', () => {
    const list: List = {
      id: 'p', name: 'P', listType: 'project', maxLevel: 3,
      levels: [
        level(1, { requirementItemIds: [{ itemId: 'ghost', quantity: 1 }, { itemId: 'known', quantity: 1 }] }),
        level(3, { rewards: [{ itemId: 'ghost', quantity: 1 }] }),
      ],
    };
    const issues = findListIssues(list, catalog, {});
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ severity: 'error', itemId: 'ghost', levels: [1, 3] });
  });

  it('looks inside action and step rewards and carried items', () => {
    const list: List = {
      id: 'q', name: 'Q', listType: 'quest', maxLevel: 1,
      levels: [level(1, {
        actions: [{ id: 'a', label: 'a', rewards: [{ itemId: 'lost-a', quantity: 1 }], carryItems: [{ itemId: 'lost-b', quantity: 1 }] }],
        tieredActions: [{ id: 't', label: 't', steps: [{ id: 's', label: 's', rewards: [{ itemId: 'lost-c', quantity: 1 }] }] }],
      })],
    };
    expect(findListIssues(list, catalog, {}).map((i) => i.itemId).sort()).toEqual(['lost-a', 'lost-b', 'lost-c']);
  });

  it('warns about used custom items that still need review, and about unknown maps', () => {
    const list: List = {
      id: 'q', name: 'Q', listType: 'quest', maxLevel: 1,
      levels: [level(1, { rewards: [{ itemId: 'reviewed', quantity: 1 }], actions: [{ id: 'a', label: 'a', maps: ['atlantis'] }] })],
    };
    const issues = findListIssues(list, catalog, { reviewed: ['Rarità provvisoria', 'Icona assente'] });
    expect(issues.map((i) => i.severity)).toEqual(['warning', 'warning']);
    expect(issues.find((i) => i.itemId === 'reviewed')?.message).toContain('Rarità provvisoria; Icona assente');
    expect(issues.some((i) => i.message.includes('atlantis'))).toBe(true);
  });

  it('reports nothing for a clean list', () => {
    const list: List = { id: 'w', name: 'W', listType: 'workbench', maxLevel: 1, levels: [level(1, { requirementItemIds: [{ itemId: 'known', quantity: 2 }] })] };
    expect(findListIssues(list, catalog, {})).toEqual([]);
  });

  describe('Reward Pass', () => {
    const pass = (levels: PassList['levels'], tracks = [{ id: 'free', name: 'Free' }, { id: 'premium', name: 'Premium' }]): PassList => ({
      id: 'pass', name: 'Pass', listType: 'pass', maxLevel: levels.length, tracks, levels,
    });

    it('flags a track without rewards and the levels without any reward', () => {
      const issues = findListIssues(pass([level(1, { rewards: [{ itemId: 'known', quantity: 1, track: 'free' }] }), level(2)]), catalog, {});
      expect(issues.find((i) => i.severity === 'warning')?.message).toContain('«Premium»');
      expect(issues.find((i) => i.severity === 'info')).toMatchObject({ levels: [2] });
    });

    it('flags rewards on a track the pass does not declare', () => {
      const issues = findListIssues(pass([level(1, { rewards: [{ itemId: 'known', quantity: 1, track: 'gold' }] })]), catalog, {});
      expect(issues.some((i) => i.severity === 'error' && i.message.includes('«gold»'))).toBe(true);
    });

    it('treats a reward without track as belonging to the first one', () => {
      const issues = findListIssues(pass([level(1, { rewards: [{ itemId: 'known', quantity: 1 }] })], [{ id: 'free', name: 'Free' }]), catalog, {});
      expect(issues).toEqual([]);
    });
  });
});

describe('reviewNotes', () => {
  it('keeps only the items that have notes', () => {
    expect(reviewNotes({ a: { review: ['x'] }, b: { review: [] }, c: {} })).toEqual({ a: ['x'] });
  });
});
