import type { ItemInfo } from '@/types';

/**
 * Pezzi in cui un outfit si sblocca: il completo di base, i toggle (elementi che si mettono o tolgono
 * sopra al completo) e i colori (applicabili al completo e ai toggle). Nel catalogo si distinguono dalla
 * sottocategoria; il legame con l'outfit di base esiste solo nell'id e non è modellato (issue #109).
 */
export type OutfitPart = 'set' | 'toggle' | 'color';

type OutfitPartSource = Pick<ItemInfo, 'item_type' | 'subcategory'>;

export function getOutfitPart(item: OutfitPartSource | undefined | null): OutfitPart | null {
  if (!item) return null;
  const sub = item.subcategory?.toLowerCase().trim();
  if (sub === 'outfit variant') return 'toggle';
  if (sub === 'outfit color') return 'color';
  if (sub === 'outfit' || item.item_type?.toLowerCase().trim() === 'outfits') return 'set';
  return null;
}

/** Chiave di traduzione dell'etichetta di un pezzo di outfit. */
export const outfitPartLabelKey = (part: OutfitPart) =>
  part === 'set' ? 'rewardPass.outfitSet' : part === 'toggle' ? 'rewardPass.outfitToggle' : 'rewardPass.outfitColor';

/**
 * Cornice che distingue il completo (piena, ambra) dai suoi componenti (tratteggiata) attorno alla card.
 * È un bordo vero, non un `outline`: ne segue gli angoli. Va su un elemento `absolute` più grande della
 * card di 4px per lato, con raggio del bordo della card + 4px.
 */
export const outfitPartFrameClass = (part: OutfitPart | null): string =>
  part === 'set' ? 'border-[3px] border-amber-300/80' : part ? 'border-[3px] border-dashed border-white/50' : '';
