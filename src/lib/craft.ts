import type { ItemInfo } from '../types';

/** Refiner level required to craft the item, or null if it can't be crafted (from MetaForge `workbench` field). */
export const refinerCraftLevel = (itemInfo?: ItemInfo): number | null => {
  const wb = itemInfo?.workbench;
  if (!wb?.toLowerCase().startsWith('refiner')) return null;
  return wb.trim().endsWith('II') ? 2 : 1;
};
