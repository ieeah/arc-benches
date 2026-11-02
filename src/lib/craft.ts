import type { ItemInfo } from '@/types';

/** Refiner level required to craft the item, or null if it can't be crafted (from MetaForge `workbench` field). */
export const refinerCraftLevel = (itemInfo?: ItemInfo): number | null => {
  const wb = itemInfo?.workbench?.trim();
  if (!wb || !wb.toLowerCase().startsWith('refiner')) return null;

  // Match suffixes like "Refiner", "Refiner 1", "Refiner I", "Refiner II", "Refiner 2", "Refiner III", "Refiner 3", etc.
  const match = wb.match(/^refiner\s*(i{1,3}|iv|v|\d+)?$/i);
  if (!match) return 1;

  const suffix = match[1]?.toUpperCase();
  if (!suffix) return 1;

  switch (suffix) {
    case 'I':
    case '1':
      return 1;
    case 'II':
    case '2':
      return 2;
    case 'III':
    case '3':
      return 3;
    case 'IV':
    case '4':
      return 4;
    case 'V':
    case '5':
      return 5;
    default: {
      const num = parseInt(suffix, 10);
      return Number.isFinite(num) && num > 0 ? num : 1;
    }
  }
};
