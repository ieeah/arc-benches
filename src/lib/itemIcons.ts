import type { ItemInfo } from '@/types';
import { getFallbackItemIcon } from '@/lib/categoryIcons';

/**
 * Icona degli oggetti che non ne hanno una propria, calcolata una volta sola sul catalogo effettivo:
 *   1. icona dell'oggetto
 *   2. icona di un altro oggetto indicato da `iconFromItem` (es. i pezzi di un outfit usano
 *      l'immagine dell'outfit di base, perché non hanno un'immagine loro)
 *   3. icona della sottocategoria, poi della categoria, poi quella generica
 * L'icona ereditata si cerca sull'icona propria dell'altro oggetto, non sul suo fallback: se anche quello
 * non ne ha una, si ricade sull'icona di sottocategoria.
 */
export function applyIconFallbacks(catalog: Record<string, ItemInfo>): void {
  const own = new Map(Object.entries(catalog).map(([id, item]) => [id, item.icon]));
  for (const [id, item] of Object.entries(catalog)) {
    if (item.icon) continue;
    const inherited = item.iconFromItem ? own.get(item.iconFromItem) : null;
    catalog[id] = { ...item, icon: inherited || getFallbackItemIcon(item.item_type, item.subcategory) };
  }
}
