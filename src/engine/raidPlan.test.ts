import { describe, it, expect } from 'vitest';
import type { RaidAction, RaidItem } from '@/types';
import {
  applyRaidPlanToStashPure,
  computeStashDiffPure,
  hasStashDiffPure,
  syncRaidWithStashPure,
} from './raidPlan';

function makeItem(overrides: Partial<RaidItem> & { id: string; itemId: string }): RaidItem {
  return {
    targetQuantity: 1,
    foundQuantity: 0,
    ...overrides,
  };
}

function makeAction(overrides: Partial<RaidAction> & { id: string }): RaidAction {
  return {
    text: overrides.id,
    completed: false,
    createdAt: 1000,
    ...overrides,
  };
}

describe('raidPlan engine', () => {
  describe('applyRaidPlanToStashPure', () => {
    it('adds found items to inventory, removes completed items, and clears completed actions', () => {
      const items: RaidItem[] = [
        makeItem({ id: 'r1', itemId: 'wires', targetQuantity: 4, foundQuantity: 4, fromStash: true, stashBaseTarget: 4 }),
        makeItem({ id: 'r2', itemId: 'bolts', targetQuantity: 3, foundQuantity: 5 }),
      ];
      const actions: RaidAction[] = [
        makeAction({ id: 'a1', completed: true }),
        makeAction({ id: 'a2', completed: false }),
      ];

      const result = applyRaidPlanToStashPure(
        { items, actions },
        { wires: 2 },
        { wires: 10, bolts: 5 },
      );

      expect(result.inventory).toEqual({ wires: 6, bolts: 5 });
      expect(result.items).toEqual([]);
      expect(result.actions).toEqual([actions[1]]);
      expect(result.addedItemsCount).toBe(9);
      expect(result.remainingItemsCount).toBe(0);
    });

    it('scales partially found items and updates stashBaseTarget, unlinking from stash when base reaches 0', () => {
      const items: RaidItem[] = [
        // Stash needed 5, user added +3 manual -> target 8, base 5. Found 2 -> target 6, base 3, still linked.
        makeItem({ id: 'r1', itemId: 'wires', targetQuantity: 8, foundQuantity: 2, fromStash: true, stashBaseTarget: 5 }),
        // Stash needed 2, user added +5 manual -> target 7, base 2. Found 3 -> target 4, base 0, unlinked.
        makeItem({ id: 'r2', itemId: 'metal', targetQuantity: 7, foundQuantity: 3, fromStash: true, stashBaseTarget: 2 }),
        // 0 found -> remains unchanged.
        makeItem({ id: 'r3', itemId: 'plastic', targetQuantity: 4, foundQuantity: 0, fromStash: true, stashBaseTarget: 4 }),
      ];

      const result = applyRaidPlanToStashPure(
        { items, actions: [] },
        {},
        { wires: 10, metal: 10, plastic: 4 },
      );

      expect(result.inventory).toEqual({ wires: 2, metal: 3 });
      expect(result.addedItemsCount).toBe(5);
      expect(result.remainingItemsCount).toBe(3);
      expect(result.items).toEqual([
        {
          id: 'r1',
          itemId: 'wires',
          targetQuantity: 6,
          foundQuantity: 0,
          fromStash: true,
          stashBaseTarget: 3,
        },
        {
          id: 'r2',
          itemId: 'metal',
          targetQuantity: 4,
          foundQuantity: 0,
          fromStash: false,
          stashBaseTarget: undefined,
        },
        items[2],
      ]);
    });

    it('does not add or scale items not required by the Stash', () => {
      const items: RaidItem[] = [
        makeItem({ id: 'r1', itemId: 'elephant-obelisk', targetQuantity: 10, foundQuantity: 4 }),
      ];

      const result = applyRaidPlanToStashPure(
        { items, actions: [] },
        { 'elephant-obelisk': 1 },
        { wires: 5 },
      );

      expect(result.inventory).toEqual({ 'elephant-obelisk': 1 });
      expect(result.items).toEqual(items);
      expect(result.addedItemsCount).toBe(0);
      expect(result.remainingItemsCount).toBe(1);
    });
  });

  describe('syncRaidWithStashPure', () => {
    it('leaves non-fromStash items untouched', () => {
      const items: RaidItem[] = [
        makeItem({ id: 'r1', itemId: 'elephant-obelisk', targetQuantity: 10, foundQuantity: 3 }),
      ];

      const synced = syncRaidWithStashPure(items, { 'elephant-obelisk': 5 }, {});
      expect(synced).toEqual(items);
    });

    it('re-aligns fromStash items with current Stash deficit and preserves manualDelta', () => {
      const items: RaidItem[] = [
        // Base was 10, user increased manually by +5 -> target 15. Inventory now has 2 of 10 needed -> neededNow = 8.
        makeItem({ id: 'r1', itemId: 'wires', targetQuantity: 15, foundQuantity: 2, fromStash: true, stashBaseTarget: 10 }),
      ];

      const synced = syncRaidWithStashPure(items, { wires: 2 }, { wires: 10 });
      expect(synced).toEqual([
        {
          id: 'r1',
          itemId: 'wires',
          targetQuantity: 13,
          foundQuantity: 2,
          fromStash: true,
          stashBaseTarget: 8,
        },
      ]);
    });

    it('keeps manualDelta and unlinks fromStash when Stash requirement is 100% covered', () => {
      const items: RaidItem[] = [
        makeItem({ id: 'r1', itemId: 'wires', targetQuantity: 15, foundQuantity: 7, fromStash: true, stashBaseTarget: 10 }),
        makeItem({ id: 'r2', itemId: 'bolts', targetQuantity: 4, foundQuantity: 1, fromStash: true, stashBaseTarget: 4 }),
      ];

      const synced = syncRaidWithStashPure(
        items,
        { wires: 10, bolts: 4 },
        { wires: 10, bolts: 4 },
      );

      expect(synced).toEqual([
        {
          id: 'r1',
          itemId: 'wires',
          targetQuantity: 5,
          foundQuantity: 5,
          fromStash: false,
          stashBaseTarget: undefined,
        },
      ]);
    });
  });

  describe('hasStashDiffPure & computeStashDiffPure', () => {
    it('returns false / no diff when fromStash items match current Stash need', () => {
      const items: RaidItem[] = [
        makeItem({ id: 'r1', itemId: 'wires', targetQuantity: 8, fromStash: true, stashBaseTarget: 5 }),
        makeItem({ id: 'r2', itemId: 'manual-only', targetQuantity: 3 }),
      ];

      expect(hasStashDiffPure(items, { wires: 2, 'manual-only': 99 }, { wires: 7 })).toBe(false);

      const summary = computeStashDiffPure(items, { wires: 2, 'manual-only': 99 }, { wires: 7 });
      expect(summary.hasStashDiff).toBe(false);
      expect(summary.diffs).toEqual([]);
      expect(summary.currentStashSnapshot).toEqual({ wires: 2 });
      expect(summary.showStashDiffBanner).toBe(false);
    });

    it('detects diff and handles ignoredStashSnapshot correctly', () => {
      const items: RaidItem[] = [
        makeItem({ id: 'r1', itemId: 'wires', targetQuantity: 5, fromStash: true, stashBaseTarget: 5 }),
      ];

      expect(hasStashDiffPure(items, { wires: 3 }, { wires: 5 })).toBe(true);

      // Diff without ignored snapshot -> banner shown
      const shown = computeStashDiffPure(items, { wires: 3 }, { wires: 5 });
      expect(shown.hasStashDiff).toBe(true);
      expect(shown.diffs).toEqual([{ itemId: 'wires', baseTarget: 5, neededNow: 2, delta: -3 }]);
      expect(shown.isDiffIgnored).toBe(false);
      expect(shown.showStashDiffBanner).toBe(true);

      // Diff with matching ignored snapshot -> banner hidden
      const ignored = computeStashDiffPure(items, { wires: 3 }, { wires: 5 }, { wires: 3 });
      expect(ignored.hasStashDiff).toBe(true);
      expect(ignored.isDiffIgnored).toBe(true);
      expect(ignored.showStashDiffBanner).toBe(false);

      // Inventory changed after ignoring -> banner shown again
      const changedAfterIgnore = computeStashDiffPure(items, { wires: 4 }, { wires: 5 }, { wires: 3 });
      expect(changedAfterIgnore.hasStashDiff).toBe(true);
      expect(changedAfterIgnore.isDiffIgnored).toBe(false);
      expect(changedAfterIgnore.showStashDiffBanner).toBe(true);
    });
  });
});
