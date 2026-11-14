import type { ItemInfo } from '@/types';

export type BlueprintCategory =
  | 'weapon'
  | 'modification'
  | 'explosive'
  | 'utility'
  | 'medical'
  | 'augment'
  | 'material';

export type BlueprintWorkbench =
  | 'weapon-bench'
  | 'equipment-bench'
  | 'explosives-bench'
  | 'med-station'
  | 'utility-bench'
  | 'refiner'
  | 'other';

export type FurnitureCategory =
  | 'storage'
  | 'seating'
  | 'tables'
  | 'lighting'
  | 'beds'
  | 'decoration'
  | 'other';

/**
 * Derives the functional gameplay category for a Blueprint.
 * Inspects unlocked target item if present, or blueprint itself.
 */
export function getBlueprintCategory(
  item: ItemInfo,
  itemsInfo: Record<string, ItemInfo>
): BlueprintCategory {
  const target = item.unlocks_item_id ? itemsInfo[item.unlocks_item_id] : null;
  const targetOrItem = target || item;
  const t = (targetOrItem.item_type || '').toLowerCase().trim();
  const sub = (targetOrItem.subcategory || '').toLowerCase().trim();
  const wb = (targetOrItem.workbench || item.workbench || '').toLowerCase().trim();
  const id = (target ? target.id : item.id).toLowerCase();

  if (t === 'weapon') return 'weapon';
  if (t === 'modification' || sub === 'modification') return 'modification';
  if (
    wb.includes('explosive') ||
    id.includes('grenade') ||
    id.includes('mine') ||
    id === 'deadline' ||
    id === 'wolfpack' ||
    id === 'showstopper' ||
    id === 'surge-coil'
  ) {
    return 'explosive';
  }
  if (
    wb.includes('med') ||
    id.includes('vita') ||
    id.includes('defibrillator') ||
    id === 'white-flag'
  ) {
    return 'medical';
  }
  if (t === 'augment' || sub === 'augment' || t === 'shield') return 'augment';
  if (t.includes('material') || t === 'key') return 'material';
  return 'utility';
}

/**
 * Derives the hideout workbench where the blueprint's item is crafted.
 */
export function getBlueprintWorkbench(
  item: ItemInfo,
  itemsInfo: Record<string, ItemInfo>
): BlueprintWorkbench {
  const target = item.unlocks_item_id ? itemsInfo[item.unlocks_item_id] : null;
  const targetOrItem = target || item;
  const wb = (targetOrItem.workbench || item.workbench || '').toLowerCase().trim();

  if (wb.includes('weapon') || wb.includes('gunsmith')) return 'weapon-bench';
  if (wb.includes('gear') || wb.includes('equipment')) return 'equipment-bench';
  if (wb.includes('explosive')) return 'explosives-bench';
  if (wb.includes('med')) return 'med-station';
  if (wb.includes('utility')) return 'utility-bench';
  if (wb.includes('refiner')) return 'refiner';

  return 'other';
}

/**
 * Derives the furniture subcategory for a Design collectible.
 */
export function getFurnitureCategory(
  design: ItemInfo,
  itemsInfo: Record<string, ItemInfo>
): FurnitureCategory {
  const furn = design.unlocks_item_id ? itemsInfo[design.unlocks_item_id] : null;
  const sub = (furn && furn.subcategory ? furn.subcategory : (design.subcategory || '')).toLowerCase().trim();

  if (sub === 'storage') return 'storage';
  if (sub === 'lighting') return 'lighting';
  if (sub === 'tables' || sub === 'table') return 'tables';
  if (
    sub === 'seating' ||
    sub === 'seat' ||
    (furn && (furn.id.includes('armchair') || furn.id.includes('sofa')))
  ) {
    return 'seating';
  }
  if (sub === 'beds' || sub === 'bed') return 'beds';
  if (sub === 'decoration' || sub === 'decorations') return 'decoration';

  return 'other';
}
