import type { ItemInfo } from '@/types';
import type { AppLanguage } from '@/i18n/types';
import { getItemName } from '@/i18n';
import { getItemVariantsData } from '@/lib/baseItems';
import {
  NON_DELIVERABLE_ITEM_TYPES,
  MAX_VISIBLE_RESULTS,
  CONTEXT_POOLS,
  getItemPoolTier as engineGetItemPoolTier,
  isPickableItem as engineIsPickableItem,
  rankItemsByRelevance as engineRankItemsByRelevance,
  type ItemPickerContext,
  type ItemPoolTier,
  type PickableOptions,
  type ItemNameResolver,
} from '@/engine/pickableItems';

export type {
  ItemPickerContext,
  ItemPoolTier,
  PickableOptions,
  ItemNameResolver,
};

export {
  NON_DELIVERABLE_ITEM_TYPES,
  MAX_VISIBLE_RESULTS,
  CONTEXT_POOLS,
};

const defaultGetItemName: ItemNameResolver = (item, language) =>
  getItemName(item, (language ?? 'en') as AppLanguage);

export function getItemPoolTier(
  item: ItemInfo,
  context: ItemPickerContext,
  excludedIds?: ReadonlySet<string>,
): ItemPoolTier | null {
  return engineGetItemPoolTier(item, context, excludedIds, getItemVariantsData());
}

export function isPickableItem(
  item: ItemInfo,
  options: PickableOptions = {},
): boolean {
  return engineIsPickableItem(item, options, getItemVariantsData());
}

export function rankItemsByRelevance(
  items: ItemInfo[],
  query: string,
  context: ItemPickerContext,
  language: string,
  itemsInfo: Record<string, ItemInfo> = {},
  maxResults: number = MAX_VISIBLE_RESULTS,
  resolveItemName: ItemNameResolver = defaultGetItemName,
): ItemInfo[] {
  return engineRankItemsByRelevance(
    items,
    query,
    context,
    language,
    itemsInfo,
    maxResults,
    resolveItemName,
    getItemVariantsData(),
  );
}
