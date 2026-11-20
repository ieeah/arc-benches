import type { RaidAction, RaidItem, RaidPlanState } from '@/types';

export type ApplyRaidPlanToStashResult = {
  inventory: Record<string, number>;
  items: RaidItem[];
  actions: RaidAction[];
  addedItemsCount: number;
  remainingItemsCount: number;
};

/**
 * Pure transformation that applies found Raid items to the Stash inventory:
 * - Items not required by the Stash are left untouched in the raid plan.
 * - Required items add `foundQuantity` to `inventory`; if `foundQuantity >= targetQuantity`,
 *   the item is removed from the raid plan; if partially found, `targetQuantity` and
 *   `stashBaseTarget` are scaled down and `foundQuantity` is reset to 0.
 * - Completed raid actions are removed; incomplete actions are preserved.
 */
export function applyRaidPlanToStashPure(
  raidPlan: Pick<RaidPlanState, 'items' | 'actions'>,
  inventory: Record<string, number>,
  totalRequired: Record<string, number>,
): ApplyRaidPlanToStashResult {
  const updatedInventory = { ...inventory };
  let addedItemsCount = 0;
  const remainingItems: RaidItem[] = [];

  for (const item of raidPlan.items) {
    const isNeeded = (totalRequired[item.itemId] ?? 0) > 0;
    if (!isNeeded) {
      // Oggetto non richiesto dallo Stash: non viene versato né scalato
      remainingItems.push(item);
      continue;
    }

    if (item.foundQuantity > 0) {
      updatedInventory[item.itemId] = (updatedInventory[item.itemId] ?? 0) + item.foundQuantity;
      addedItemsCount += item.foundQuantity;
    }

    if (item.foundQuantity >= item.targetQuantity) {
      // Rimuovi item dal raid (raggiunto o superato)
      continue;
    } else if (item.foundQuantity > 0) {
      // Trovato parzialmente: scala targetQuantity, resetta foundQuantity a 0
      const nextTarget = Math.max(1, item.targetQuantity - item.foundQuantity);
      const nextBaseTarget = item.fromStash
        ? Math.max(0, (item.stashBaseTarget ?? item.targetQuantity) - item.foundQuantity)
        : 0;
      const stillLinkedToStash = Boolean(item.fromStash && nextBaseTarget > 0);

      remainingItems.push({
        ...item,
        targetQuantity: nextTarget,
        fromStash: stillLinkedToStash,
        stashBaseTarget: stillLinkedToStash ? nextBaseTarget : undefined,
        foundQuantity: 0,
      });
    } else {
      // Nessun progresso trovato: rimane invariato
      remainingItems.push(item);
    }
  }

  // Rimuove azioni completate, mantiene quelle incompiute
  const remainingActions = raidPlan.actions.filter(a => !a.completed);

  return {
    inventory: updatedInventory,
    items: remainingItems,
    actions: remainingActions,
    addedItemsCount,
    remainingItemsCount: remainingItems.length,
  };
}

/**
 * Pure transformation that synchronizes `fromStash` raid items with the current
 * Stash requirements and inventory, preserving any `manualDelta` added by the user.
 */
export function syncRaidWithStashPure(
  items: RaidItem[],
  inventory: Record<string, number>,
  totalRequired: Record<string, number>,
): RaidItem[] {
  const syncedItems: RaidItem[] = [];

  for (const item of items) {
    if (!item.fromStash) {
      // Aggiunto ex novo nel Raid: non viene toccato dallo Stash
      syncedItems.push(item);
      continue;
    }

    const neededNow = Math.max(0, (totalRequired[item.itemId] ?? 0) - (inventory[item.itemId] ?? 0));
    const baseTarget = item.stashBaseTarget ?? item.targetQuantity;
    const manualDelta = item.targetQuantity - baseTarget;
    const newTarget = Math.max(0, neededNow + manualDelta);

    if (newTarget > 0) {
      syncedItems.push({
        ...item,
        targetQuantity: newTarget,
        foundQuantity: Math.min(item.foundQuantity, newTarget),
        fromStash: neededNow > 0,
        stashBaseTarget: neededNow > 0 ? neededNow : undefined,
      });
    }
  }

  return syncedItems;
}

export type StashDiffEntry = {
  itemId: string;
  baseTarget: number;
  neededNow: number;
  delta: number;
};

export type StashDiffSummary = {
  stashTrackedItems: RaidItem[];
  currentStashSnapshot: Record<string, number>;
  diffs: StashDiffEntry[];
  hasStashDiff: boolean;
  isDiffIgnored: boolean;
  showStashDiffBanner: boolean;
};

/**
 * Pure check whether any `fromStash` raid item has drifted from the current Stash need.
 */
export function hasStashDiffPure(
  items: RaidItem[],
  inventory: Record<string, number>,
  totalRequired: Record<string, number>,
): boolean {
  return items.some(item => {
    if (!item.fromStash) return false;
    const neededNow = Math.max(0, (totalRequired[item.itemId] ?? 0) - (inventory[item.itemId] ?? 0));
    const baseTarget = item.stashBaseTarget ?? item.targetQuantity;
    return neededNow !== baseTarget;
  });
}

/**
 * Computes the full Stash diff summary (tracked items, current snapshot, diffs, and banner visibility).
 */
export function computeStashDiffPure(
  items: RaidItem[],
  inventory: Record<string, number>,
  totalRequired: Record<string, number>,
  ignoredStashSnapshot?: Record<string, number>,
): StashDiffSummary {
  const stashTrackedItems = items.filter(i => i.fromStash);
  const currentStashSnapshot: Record<string, number> = {};
  const diffs: StashDiffEntry[] = [];

  for (const item of stashTrackedItems) {
    const owned = inventory[item.itemId] ?? 0;
    currentStashSnapshot[item.itemId] = owned;

    const neededNow = Math.max(0, (totalRequired[item.itemId] ?? 0) - owned);
    const baseTarget = item.stashBaseTarget ?? item.targetQuantity;
    if (neededNow !== baseTarget) {
      diffs.push({
        itemId: item.itemId,
        baseTarget,
        neededNow,
        delta: neededNow - baseTarget,
      });
    }
  }

  const hasStashDiff = diffs.length > 0;
  const isDiffIgnored = Boolean(ignoredStashSnapshot) &&
    stashTrackedItems.every(item => (inventory[item.itemId] ?? 0) === ignoredStashSnapshot![item.itemId]);

  return {
    stashTrackedItems,
    currentStashSnapshot,
    diffs,
    hasStashDiff,
    isDiffIgnored,
    showStashDiffBanner: hasStashDiff && !isDiffIgnored,
  };
}
