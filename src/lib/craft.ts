import type { CraftInfo, CraftMode, ItemInfo } from '@/types';
import {
  WORKBENCHES_META,
  getWorkbenchName,
  getWorkbenchShortName,
  getWorkbenchBadgeShort,
  parseWorkbenchRequirement,
  getBlueprintIdForItem,
  getCraftInfo as engineGetCraftInfo,
  refinerCraftLevel,
  getItemCraftStatus as engineGetItemCraftStatus,
  type WorkbenchMeta,
  type ItemCraftStatusResult,
} from '@/engine/crafting';
import { getItemVariantsData } from '@/lib/baseItems';
import { getItemName, type AppLanguage } from '@/i18n';

export type { WorkbenchMeta, ItemCraftStatusResult };
export {
  WORKBENCHES_META,
  getWorkbenchName,
  getWorkbenchShortName,
  getWorkbenchBadgeShort,
  parseWorkbenchRequirement,
  getBlueprintIdForItem,
  refinerCraftLevel,
};

export const getCraftInfo = (
  itemInfo?: ItemInfo,
  itemsInfo?: Record<string, ItemInfo>,
): CraftInfo | null => engineGetCraftInfo(itemInfo, itemsInfo, getItemVariantsData());

export function getItemCraftStatus(
  itemInfo: ItemInfo | undefined,
  currentLevels: Record<string, number>,
  ownedBlueprints?: Record<string, boolean>,
  craftMode: CraftMode = 'level-only',
  itemsInfo?: Record<string, ItemInfo>,
): ItemCraftStatusResult {
  return engineGetItemCraftStatus(
    itemInfo,
    currentLevels,
    ownedBlueprints,
    craftMode,
    itemsInfo,
    getItemVariantsData(),
  );
}

export function getCraftTooltip(
  craftResult: ItemCraftStatusResult,
  itemsInfo: Record<string, ItemInfo>,
  t: (path: string, params?: Record<string, string | number>) => string,
  language: AppLanguage,
): string | undefined {
  if (!craftResult.craftInfo) return undefined;
  const benchName = getWorkbenchName(craftResult.craftInfo.workbenchId, t);
  if (craftResult.status === 'craftable') {
    return craftResult.craftInfo.workbenchId === 'workbench'
      ? t('stash.craftableNowBasic')
      : t('stash.craftableNowInWorkbench', { bench: benchName, level: craftResult.craftInfo.levelRequired });
  }
  if (craftResult.status === 'needs_project') {
    const bpItem = craftResult.craftInfo.recipeId ? itemsInfo[craftResult.craftInfo.recipeId] : undefined;
    const bpName = bpItem ? getItemName(bpItem, language) : (craftResult.craftInfo.recipeId ?? '');
    return t('stash.requiresBlueprint', { name: bpName });
  }
  return t('stash.requiresWorkbenchLevelShort', {
    bench: benchName,
    level: craftResult.craftInfo.levelRequired,
    current: craftResult.currentBenchLevel,
  });
}
