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
