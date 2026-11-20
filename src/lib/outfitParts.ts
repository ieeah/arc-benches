import type { OutfitPart } from '@/engine/outfitParts';

export { getOutfitPart, outfitPartLabelKey } from '@/engine/outfitParts';
export type { OutfitPart } from '@/engine/outfitParts';

/**
 * Cornice che distingue il completo (piena, ambra) dai suoi componenti (tratteggiata) attorno alla card.
 * È un bordo vero, non un `outline`: ne segue gli angoli. Va su un elemento `absolute` più grande della
 * card di 4px per lato, con raggio del bordo della card + 4px.
 */
export const outfitPartFrameClass = (part: OutfitPart | null): string =>
  part === 'set' ? 'border-[3px] border-amber-300/80' : part ? 'border-[3px] border-dashed border-white/50' : '';
