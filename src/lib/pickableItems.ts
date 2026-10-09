import type { ItemInfo } from '@/types';

/**
 * Tipi che non si possono trovare né portare in raid: mai un requisito di consegna.
 * Le nuove uscite possono introdurre altri tipi cosmetici: l'elenco vive solo qui.
 */
export const NON_DELIVERABLE_ITEM_TYPES: ReadonlySet<string> = new Set([
  'Blueprint', 'Cosmetic', 'Outfits', 'Furniture', 'Research', 'Currency',
]);

export interface PickableOptions {
  /** Ricompense: qualsiasi oggetto del catalogo (blueprint, cosmetici, valute…). */
  includeAll?: boolean;
  /** Oggetti già scelti: esclusi dall'elenco. */
  excludedIds?: ReadonlySet<string>;
}

/** Un oggetto è selezionabile se non è nascosto (né già scelto) e, per le consegne, è "di gioco". */
export function isPickableItem(item: ItemInfo, { includeAll = false, excludedIds }: PickableOptions = {}): boolean {
  if (excludedIds?.has(item.id)) return false;
  if (item.hidden) return false;
  return includeAll || !NON_DELIVERABLE_ITEM_TYPES.has(item.item_type);
}
