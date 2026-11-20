import type { CheckboxAction, ItemInfo, List, StashPriorityMode } from '@/types';
import { currentLevelOf, isActionWindowOpen, unmetRequirements } from '@/engine/lists';
import { isListExpired } from '@/engine/expeditions';

export type MissingMaterial = {
  itemId: string;
  owned: number;
  required: number;
  missing: number;
  isCompleted: boolean;
};

export function getAllListsPure(
  workbenches: List[],
  projects: List[],
  sharedCustomLists: List[],
  customLists: List[],
  activeExpedition?: List,
): List[] {
  return [
    ...workbenches,
    ...projects,
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
  return orderedLists.filter(l => currentLevelOf(l, currentLevels) < l.maxLevel);
}

export function getMaxedListsPure(
  orderedLists: List[],
  currentLevels: Record<string, number>,
): List[] {
  return orderedLists.filter(l => currentLevelOf(l, currentLevels) >= l.maxLevel);
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
    const current = currentLevelOf(list, currentLevels);
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

/**
 * A level is ready to complete only when its materials are in the inventory AND every checkbox
 * action of that level is ticked (checkedActions keys: `${listId}|${level}|${actionId}`), and every
 * step of every tiered action too (keys: `${listId}|${level}|${tieredId}:${stepId}`).
 */
export function getAvailableUpgradesPure(
  allLists: List[],
  activeModules: Record<string, boolean>,
  currentLevels: Record<string, number>,
  inventory: Record<string, number>,
  now: number = Date.now(),
  checkedActions: Record<string, boolean> = {},
): string[] {
  return allLists
    .filter(list => {
      if (!activeModules[list.id] || isListExpired(list, now)) return false;
      const current = currentLevelOf(list, currentLevels);
      if (current >= list.maxLevel) return false;
      const nextLevel = list.levels.find(l => l.level === current + 1);
      if (!nextLevel) return false;
      const materialsReady = nextLevel.requirementItemIds.every(
        req => Boolean(checkedActions[`${list.id}|${nextLevel.level}|item_${req.itemId}`]) ||
          (inventory[req.itemId] ?? 0) >= req.quantity,
      );
      const actionsDone = (nextLevel.actions ?? []).every(
        action => checkedActions[`${list.id}|${nextLevel.level}|${action.id}`],
      );
      const tieredDone = (nextLevel.tieredActions ?? []).every(tiered =>
        tiered.steps.every(step => checkedActions[`${list.id}|${nextLevel.level}|${tiered.id}:${step.id}`]),
      );
      return materialsReady && actionsDone && tieredDone && unmetRequirements(nextLevel, currentLevels).length === 0;
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
  const current = currentLevelOf(list, currentLevels);
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

export function getAllBlueprintsPure(itemsInfo: Record<string, ItemInfo>): ItemInfo[] {
  return Object.values(itemsInfo).filter(
    item => !item.hidden && (item.item_type === 'Blueprint' || item.subcategory === 'Blueprint'),
  );
}

export function getBlueprintProgressPure(
  blueprints: ItemInfo[],
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

export function getAllDesignsPure(itemsInfo: Record<string, ItemInfo>): ItemInfo[] {
  return Object.values(itemsInfo).filter(
    item => !item.hidden && (item.item_type === 'Design' || item.subcategory === 'Design'),
  );
}

export function getDesignProgressPure(
  designs: ItemInfo[],
  ownedDesigns: Record<string, boolean>,
): { ownedCount: number; totalCount: number; percentage: number } {
  const totalCount = designs.length;
  let ownedCount = 0;
  for (const d of designs) {
    if (ownedDesigns[d.id]) ownedCount++;
  }
  const percentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;
  return { ownedCount, totalCount, percentage };
}

export function getAllStencilsPure(itemsInfo: Record<string, ItemInfo>): ItemInfo[] {
  return Object.values(itemsInfo).filter(
    item => !item.hidden && (item.item_type === 'Stencil' || item.subcategory === 'Stencil'),
  );
}

export function getStencilProgressPure(
  stencils: ItemInfo[],
  ownedStencils: Record<string, boolean>,
): { ownedCount: number; totalCount: number; percentage: number } {
  const totalCount = stencils.length;
  let ownedCount = 0;
  for (const s of stencils) {
    if (ownedStencils[s.id]) ownedCount++;
  }
  const percentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;
  return { ownedCount, totalCount, percentage };
}

export function getGlobalCollectionsProgressPure(
  itemsInfo: Record<string, ItemInfo>,
  ownedBlueprints: Record<string, boolean>,
  ownedDesigns: Record<string, boolean>,
  ownedStencils: Record<string, boolean>,
): {
  blueprints: { ownedCount: number; totalCount: number; percentage: number };
  designs: { ownedCount: number; totalCount: number; percentage: number };
  stencils: { ownedCount: number; totalCount: number; percentage: number };
  total: { ownedCount: number; totalCount: number; percentage: number };
} {
  const blueprints = getAllBlueprintsPure(itemsInfo);
  const designs = getAllDesignsPure(itemsInfo);
  const stencils = getAllStencilsPure(itemsInfo);

  const bpProgress = getBlueprintProgressPure(blueprints, ownedBlueprints);
  const desProgress = getDesignProgressPure(designs, ownedDesigns);
  const stenProgress = getStencilProgressPure(stencils, ownedStencils);

  const totalCount = bpProgress.totalCount + desProgress.totalCount + stenProgress.totalCount;
  const ownedCount = bpProgress.ownedCount + desProgress.ownedCount + stenProgress.ownedCount;
  const percentage = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  return {
    blueprints: bpProgress,
    designs: desProgress,
    stencils: stenProgress,
    total: { ownedCount, totalCount, percentage },
  };
}

export type ItemListDependency = {
  listId: string;
  listName: string;
  level: number;
  quantity: number;
  isCustom?: boolean;
  expirationDate?: string;
};

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
    const current = currentLevelOf(list, currentLevels);
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

/**
 * Calcola il punteggio di priorità di ciascun oggetto richiesto nello Stash (#69):
 * - `list-first` (Lista → Livello): priorità alla lista in `orderedLists`, poi al livello crescente.
 * - `level-first` (Livello → Lista): priorità al passo relativo imminente (`lvl.level - current`), poi all'ordine delle liste.
 */
export function getItemPriorityMapPure(
  orderedLists: List[],
  activeModules: Record<string, boolean>,
  currentLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  mode: StashPriorityMode = 'list-first',
  now: number = Date.now(),
  checkedActions: Record<string, boolean> = {},
): Map<string, number> {
  const map = new Map<string, number>();
  orderedLists.forEach((list, listIndex) => {
    if (!activeModules[list.id] || isListExpired(list, now)) return;
    const current = currentLevelOf(list, currentLevels);
    const selected = targetLevels[list.id] ?? [];
    list.levels.forEach(lvl => {
      if (lvl.level <= current || !selected.includes(lvl.level)) return;
      const stepDelta = Math.max(1, lvl.level - current);
      const score = mode === 'level-first'
        ? stepDelta * 1000 + listIndex
        : listIndex * 1000 + lvl.level;
      lvl.requirementItemIds.forEach(req => {
        if (checkedActions[`${list.id}|${lvl.level}|item_${req.itemId}`]) return;
        const prev = map.get(req.itemId);
        if (prev === undefined || score < prev) {
          map.set(req.itemId, score);
        }
      });
    });
  });
  return map;
}

export type StashAction = {
  listId: string;
  listName: string;
  list?: List;
  level: number;
  actionId: string;
  label: string;
  action?: CheckboxAction;
  isCustom?: boolean;
  isCompleted: boolean;
};

export type MissingAction = StashAction;

/**
 * Returns the actions that count right now: only the level after the current one (the "window",
 * `current + 1`), and only if it is one of the selected target levels. Actions of levels already
 * passed or of levels further ahead are not shown (#111).
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
    const current = currentLevelOf(list, currentLevels);
    const selected = targetLevels[list.id] ?? [];
    for (const lvl of list.levels) {
      if (isActionWindowOpen(lvl.level, current) && selected.includes(lvl.level)) {
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
