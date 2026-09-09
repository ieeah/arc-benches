import type { List, CheckboxAction, TieredAction } from '@/types';
import { isListExpired } from '@/lib/expiration';

export { isListExpired };

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
  activeExpedition?: List,
): List[] {
  return [
    ...workbenches,
    ...sharedCustomLists,
    ...customLists,
    ...(activeExpedition ? [activeExpedition] : []),
  ];
}

export function getOrderedListsPure(allLists: List[], listOrder: string[]): List[] {
  const orderMap = new Map(listOrder.map((id, i) => [id, i]));
  return [...allLists].sort(
    (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999),
  );
}

export function getRefinerLevelPure(
  currentLevels: Record<string, number>,
  refinerId: string,
): number {
  return currentLevels[refinerId] ?? 0;
}

export function getActiveListsPure(
  orderedLists: List[],
  currentLevels: Record<string, number>,
): List[] {
  return orderedLists.filter(l => (currentLevels[l.id] ?? 0) < l.maxLevel);
}

export function getMaxedListsPure(
  orderedLists: List[],
  currentLevels: Record<string, number>,
): List[] {
  return orderedLists.filter(l => (currentLevels[l.id] ?? 0) >= l.maxLevel);
}

export function getTotalRequiredMaterialsPure(
  allLists: List[],
  activeModules: Record<string, boolean>,
  currentLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  excludeModuleId?: string,
  now: number = Date.now(),
  checkedActions?: Record<string, boolean>,
): Record<string, number> {
  const total: Record<string, number> = {};
  for (const list of allLists) {
    if (list.id === excludeModuleId || !activeModules[list.id] || isListExpired(list, now)) continue;
    const current = currentLevels[list.id] ?? 0;
    const selected = targetLevels[list.id] ?? [];
    for (const lvl of list.levels) {
      if (lvl.level > current && selected.includes(lvl.level)) {
        for (const req of lvl.requirementItemIds) {
          // If this material requirement has been individually marked as delivered/completed, skip it
          if (checkedActions && checkedActions[`${list.id}|${lvl.level}|item_${req.itemId}`]) {
            continue;
          }
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
  currentLevels: Record<string, number>,
  inventory: Record<string, number>,
  now: number = Date.now(),
): string[] {
  return allLists
    .filter(list => {
      if (!activeModules[list.id] || isListExpired(list, now)) return false;
      const current = currentLevels[list.id] ?? 0;
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
  currentLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  now: number = Date.now(),
  checkedActions?: Record<string, boolean>,
): Record<string, number> {
  if (isListExpired(list, now)) {
    return { ...totalRequired };
  }
  const result = { ...totalRequired };
  const current = currentLevels[list.id] ?? 0;
  const selected = targetLevels[list.id] ?? [];
  for (const lvl of list.levels) {
    if (lvl.level > current && selected.includes(lvl.level)) {
      for (const req of lvl.requirementItemIds) {
        if (checkedActions && checkedActions[`${list.id}|${lvl.level}|item_${req.itemId}`]) {
          continue;
        }
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

export function getAllBlueprintsPure(itemsInfo: Record<string, import('@/types').ItemInfo>): import('@/types').ItemInfo[] {
  return Object.values(itemsInfo).filter(
    item => !item.hidden && (item.item_type === 'Blueprint' || item.subcategory === 'Blueprint')
  );
}

export function getBlueprintProgressPure(
  blueprints: import('@/types').ItemInfo[],
  ownedBlueprints: Record<string, boolean>,
): { ownedCount: number; totalCount: number; percentage: number } {
  const totalCount = blueprints.length;
  let ownedCount = 0;
  for (const bp of blueprints) {
    if (ownedBlueprints[bp.id]) ownedCount++;
  }
  const percentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;
  return { ownedCount, totalCount, percentage };
}

export interface ItemListDependency {
  listId: string;
  listName: string;
  level: number;
  quantity: number;
  isCustom?: boolean;
  expirationDate?: string;
}

export function getItemDependenciesPure(
  itemId: string,
  allLists: List[],
  activeModules: Record<string, boolean>,
  currentLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  now: number = Date.now(),
  checkedActions?: Record<string, boolean>,
): ItemListDependency[] {
  const deps: ItemListDependency[] = [];
  for (const list of allLists) {
    if (!activeModules[list.id] || isListExpired(list, now)) continue;
    const current = currentLevels[list.id] ?? 0;
    const selected = targetLevels[list.id] ?? [];
    for (const lvl of list.levels) {
      if (lvl.level > current && selected.includes(lvl.level)) {
        const req = lvl.requirementItemIds.find(r => r.itemId === itemId);
        if (req) {
          // If this requirement is already checked off, don't show it as an outstanding dependency
          if (checkedActions && checkedActions[`${list.id}|${lvl.level}|item_${req.itemId}`]) {
            continue;
          }
          deps.push({
            listId: list.id,
            listName: list.name,
            level: lvl.level,
            quantity: req.quantity,
            isCustom: Boolean(list.custom),
            expirationDate: list.expirationDate,
          });
        }
      }
    }
  }
  return deps;
}

export interface StashAction {
  listId: string;
  listName: string;
  list?: List;
  level: number;
  actionId: string;
  label: string;
  action?: CheckboxAction;
  isCustom?: boolean;
  isCompleted: boolean;
}

export type MissingAction = StashAction;

/**
 * Returns actions only for levels that have been reached (up to currentLevel + 1),
 * preventing uncompletable future level actions from polluting the UI.
 */
export function getStashActionsPure(
  allLists: List[],
  activeModules: Record<string, boolean>,
  currentLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  checkedActions: Record<string, boolean>,
  now: number = Date.now(),
): StashAction[] {
  const actions: StashAction[] = [];
  for (const list of allLists) {
    if (!activeModules[list.id] || isListExpired(list, now)) continue;
    const current = currentLevels[list.id] ?? 0;
    const selected = targetLevels[list.id] ?? [];
    for (const lvl of list.levels) {
      // Actions are only displayed if the level has been reached (lvl.level <= current + 1)
      if (lvl.level <= current + 1 && selected.includes(lvl.level)) {
        for (const action of lvl.actions ?? []) {
          const key = `${list.id}|${lvl.level}|${action.id}`;
          const isCompleted = Boolean(checkedActions[key]);
          actions.push({
            listId: list.id,
            listName: list.name,
            list,
            level: lvl.level,
            actionId: action.id,
            label: action.label,
            action,
            isCustom: Boolean(list.custom),
            isCompleted,
          });
        }
        for (const tiered of lvl.tieredActions ?? []) {
          for (const step of tiered.steps ?? []) {
            const key = `${list.id}|${lvl.level}|${tiered.id}:${step.id}`;
            const isCompleted = Boolean(checkedActions[key]);
            actions.push({
              listId: list.id,
              listName: list.name,
              list,
              level: lvl.level,
              actionId: `${tiered.id}:${step.id}`,
              label: `${tiered.label} — ${step.label}`,
              action: { id: `${tiered.id}:${step.id}`, label: `${tiered.label} — ${step.label}`, translations: step.translations },
              isCustom: Boolean(list.custom),
              isCompleted,
            });
          }
        }
      }
    }
  }
  return actions;
}

export function getMissingActionsPure(
  allLists: List[],
  activeModules: Record<string, boolean>,
  currentLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  checkedActions: Record<string, boolean>,
  now: number = Date.now(),
): MissingAction[] {
  return getStashActionsPure(allLists, activeModules, currentLevels, targetLevels, checkedActions, now)
    .filter(a => !a.isCompleted);
}

/**
 * Computes how many phases of an expedition are completed sequentially (0 to 6).
 * Phase N is completed only if all its material requirements (checked or owned) and actions are met,
 * and all preceding phases 1..N-1 are completed.
 */
export function getExpeditionCompletedPhasePure(
  caravan: List | undefined,
  inventory: Record<string, number>,
  checkedActions: Record<string, boolean>,
): number {
  if (!caravan) return 0;
  let completed = 0;
  for (const lvl of caravan.levels) {
    const hasItems = lvl.requirementItemIds.length > 0;
    const hasActions = (lvl.actions?.length ?? 0) > 0;
    const hasTiered = (lvl.tieredActions?.length ?? 0) > 0;

    const isItemsDone = !hasItems || lvl.requirementItemIds.every(
      req => Boolean(checkedActions[`${caravan.id}|${lvl.level}|item_${req.itemId}`]) || (inventory[req.itemId] ?? 0) >= req.quantity,
    );
    const isActionsDone = !hasActions || (lvl.actions ?? []).every(
      a => Boolean(checkedActions[`${caravan.id}|${lvl.level}|${a.id}`]),
    );
    const isTieredDone = !hasTiered || (lvl.tieredActions ?? []).every(
      t => (t.steps ?? []).every(s => Boolean(checkedActions[`${caravan.id}|${lvl.level}|${t.id}:${s.id}`])),
    );

    if (isItemsDone && isActionsDone && isTieredDone) {
      completed = lvl.level;
    } else {
      break; // Sequential: cannot complete level N if level N-1 is incomplete
    }
  }
  return completed;
}

/**
 * Returns the active expedition based on completedExpeditionsCount (1-indexed progression).
 */
export function getActiveExpeditionPure(
  expeditions: List[],
  completedExpeditionsCount: number,
): List | undefined {
  if (!expeditions.length) return undefined;
  const targetIndex = completedExpeditionsCount + 1;
  const found = expeditions.find(e => e.expeditionIndex === targetIndex);
  if (found) return found;
  // If player passed all defined caravans, cycle or clamp to last
  const cyclicIndex = ((targetIndex - 1) % expeditions.length) + 1;
  return expeditions.find(e => e.expeditionIndex === cyclicIndex) ?? expeditions[expeditions.length - 1];
}

/**
 * Computes how many damage challenge tiers are checked (0 to total steps).
 */
export function getExpeditionDamageTierPure(
  checkedActions: Record<string, boolean>,
  damageChallenge?: TieredAction | null,
): number {
  if (damageChallenge?.steps && damageChallenge.steps.length > 0) {
    let count = 0;
    for (const step of damageChallenge.steps) {
      if (
        checkedActions[`expedition-damage|0|${damageChallenge.id}:${step.id}`] ||
        checkedActions[`expedition-damage|0|${step.id}`] ||
        checkedActions[`expedition-damage|0|tier_${step.id}`]
      ) {
        count++;
      }
    }
    return count;
  }

  let count = 0;
  for (let i = 1; i <= 5; i++) {
    if (
      checkedActions[`expedition-damage|0|tier_${i}`] ||
      checkedActions[`expedition-damage|0|damage-challenge:tier-${i}`]
    ) {
      count++;
    }
  }
  return count;
}

/**
 * Computes how many catch-up SP checkboxes are selected (0 to 5).
 */
export function getExpeditionCatchupSPPure(checkedActions: Record<string, boolean>): number {
  let count = 0;
  for (let i = 1; i <= 5; i++) {
    if (checkedActions[`expedition-catchup|0|sp_${i}`]) {
      count++;
    }
  }
  return count;
}

export interface ExpeditionRewardEstimate {
  skillPoints: number;
  tokenReward: number;
  blueprintReward: number;
}

/**
 * Calculates estimated prestige rewards based on expedition index and checked challenge tiers.
 * - Expeditions 1-3: each damage tier gives 1 SP.
 * - Expeditions >= 4: each damage tier gives 1 Mystery Reward (+1 Blueprint, +150 Tokens).
 * - Catch-up: each selected point gives 1 SP.
 */
export function calculateExpeditionRewardPure(
  completedExpeditionsCount: number,
  damageTier: number,
  catchupSP: number,
): ExpeditionRewardEstimate {
  let skillPoints = catchupSP;
  let tokenReward = 0;
  let blueprintReward = 0;

  if (completedExpeditionsCount < 3) {
    skillPoints += damageTier;
  } else {
    tokenReward = damageTier * 150;
    blueprintReward = damageTier;
  }

  return {
    skillPoints,
    tokenReward,
    blueprintReward,
  };
}

/**
 * Determines whether the expedition departure window is currently open based on startDate and expirationDate,
 * or if no date bounds are defined, returns true by default.
 */
export function isDepartureWindowActivePure(
  expedition?: List,
  now: number = Date.now(),
): boolean {
  if (!expedition) return false;
  const start = expedition.startDate ? new Date(expedition.startDate).getTime() : undefined;
  const end = expedition.expirationDate ? new Date(expedition.expirationDate).getTime() : undefined;

  if (start !== undefined && !isNaN(start) && now < start) {
    return false; // Window not opened yet
  }
  if (end !== undefined && !isNaN(end) && now > end) {
    return false; // Window already closed / departed
  }
  return true;
}



