import type { List } from '../types';

export interface MissingMaterial {
  itemId: string;
  owned: number;
  required: number;
  missing: number;
  isCompleted: boolean;
}

export function getAllListsPure(
  workbenches: List[],
  sharedCustomLists: List[],
  customLists: List[],
): List[] {
  return [...workbenches, ...sharedCustomLists, ...customLists];
}

export function getOrderedListsPure(allLists: List[], listOrder: string[]): List[] {
  const orderMap = new Map(listOrder.map((id, i) => [id, i]));
  return [...allLists].sort(
    (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999),
  );
}

export function getRefinerLevelPure(
  hideoutLevels: Record<string, number>,
  refinerId: string,
): number {
  return hideoutLevels[refinerId] ?? 0;
}

export function getActiveListsPure(
  orderedLists: List[],
  hideoutLevels: Record<string, number>,
): List[] {
  return orderedLists.filter(l => (hideoutLevels[l.id] ?? 0) < l.maxLevel);
}

export function getMaxedListsPure(
  orderedLists: List[],
  hideoutLevels: Record<string, number>,
): List[] {
  return orderedLists.filter(l => (hideoutLevels[l.id] ?? 0) >= l.maxLevel);
}

export function getTotalRequiredMaterialsPure(
  allLists: List[],
  activeModules: Record<string, boolean>,
  hideoutLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  excludeModuleId?: string,
): Record<string, number> {
  const total: Record<string, number> = {};
  for (const list of allLists) {
    if (list.id === excludeModuleId || !activeModules[list.id]) continue;
    const current = hideoutLevels[list.id] ?? 0;
    const selected = targetLevels[list.id] ?? [];
    for (const lvl of list.levels) {
      if (lvl.level > current && selected.includes(lvl.level)) {
        for (const req of lvl.requirementItemIds) {
          total[req.itemId] = (total[req.itemId] ?? 0) + req.quantity;
        }
      }
    }
  }
  return total;
}

export function getMissingMaterialsPure(
  totalRequired: Record<string, number>,
  inventory: Record<string, number>,
): MissingMaterial[] {
  return Object.entries(totalRequired).map(([itemId, reqQty]) => {
    const owned = inventory[itemId] ?? 0;
    return {
      itemId,
      owned,
      required: reqQty,
      missing: Math.max(0, reqQty - owned),
      isCompleted: owned >= reqQty,
    };
  });
}

export function getAvailableUpgradesPure(
  allLists: List[],
  activeModules: Record<string, boolean>,
  hideoutLevels: Record<string, number>,
  inventory: Record<string, number>,
): string[] {
  return allLists
    .filter(list => {
      if (!activeModules[list.id]) return false;
      const current = hideoutLevels[list.id] ?? 0;
      if (current >= list.maxLevel) return false;
      const nextLevel = list.levels.find(l => l.level === current + 1);
      if (!nextLevel) return false;
      return nextLevel.requirementItemIds.every(
        req => (inventory[req.itemId] ?? 0) >= req.quantity,
      );
    })
    .map(list => list.id);
}

/**
 * Computes required materials for all lists except the given one.
 * Starts from the pre-computed `totalRequired` and subtracts this list's
 * contribution — O(levels×items) instead of O(allLists×levels×items).
 */
export function getOtherNeedsPure(
  totalRequired: Record<string, number>,
  list: List,
  hideoutLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
): Record<string, number> {
  const result = { ...totalRequired };
  const current = hideoutLevels[list.id] ?? 0;
  const selected = targetLevels[list.id] ?? [];
  for (const lvl of list.levels) {
    if (lvl.level > current && selected.includes(lvl.level)) {
      for (const req of lvl.requirementItemIds) {
        const remaining = (result[req.itemId] ?? 0) - req.quantity;
        if (remaining <= 0) {
          delete result[req.itemId];
        } else {
          result[req.itemId] = remaining;
        }
      }
    }
  }
  return result;
}
