import { Palette, Shirt, ToggleRight } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { outfitPartLabelKey, type OutfitPart } from '@/lib/outfitParts';
import { CornerBadge } from '@/components/pass/CornerBadge';

const CONFIG: Record<OutfitPart, { icon: typeof Shirt; background: string }> = {
  set: { icon: Shirt, background: 'bg-amber-500' },
  toggle: { icon: ToggleRight, background: 'bg-sky-500' },
  color: { icon: Palette, background: 'bg-pink-500' },
};

/** Badge ad angolo: simbolo diverso per completo, toggle e colore di un outfit. */
export const OutfitPartBadge = ({ part }: { part: OutfitPart }) => {
  const { t } = useTranslation();
  const { icon: Icon, background } = CONFIG[part];
  return (
    <CornerBadge title={t(outfitPartLabelKey(part))} className={background}>
      <Icon size={11} className="text-white" strokeWidth={2.75} aria-hidden />
    </CornerBadge>
  );
};
