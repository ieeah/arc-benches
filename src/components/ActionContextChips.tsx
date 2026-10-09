import { MapPin, Backpack } from 'lucide-react';
import type { ActionContext } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getItemName } from '@/i18n';
import { getMapName } from '@/lib/maps';
import { cn } from '@/lib/cn';

interface ActionContextChipsProps extends ActionContext {
  className?: string;
  /** Righe strette (step di una timeline): chip più piccoli. */
  compact?: boolean;
}

/**
 * Vincoli di contesto di un'azione: mappe in cui va compiuta e oggetti da portare in mappa.
 * Sono solo informativi: gli oggetti da portare non entrano nel fabbisogno dello Stash.
 */
export const ActionContextChips = ({ maps, carryItems, className, compact = false }: ActionContextChipsProps) => {
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const { language, t } = useTranslation();
  const hasMaps = (maps?.length ?? 0) > 0;
  const hasCarry = (carryItems?.length ?? 0) > 0;
  if (!hasMaps && !hasCarry) return null;

  const chip = cn(
    'inline-flex items-center gap-1 rounded-full font-semibold border',
    compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
  );

  return (
    <span className={cn('flex items-center gap-1 flex-wrap', className)}>
      {hasMaps && (
        <span
          className={cn(chip, 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/50')}
          title={t('lists.requiredMaps')}
        >
          <MapPin size={compact ? 9 : 10} className="shrink-0" />
          <span>{maps!.map(getMapName).join(' · ')}</span>
        </span>
      )}
      {hasCarry && (
        <span
          className={cn(chip, 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50')}
          title={t('lists.carryItems')}
        >
          <Backpack size={compact ? 9 : 10} className="shrink-0" />
          <span>
            {carryItems!
              .map((c) => {
                const info = itemsInfo[c.itemId];
                const name = info ? getItemName(info, language) || c.itemId : c.itemId;
                return c.quantity > 1 ? `${name} ×${c.quantity}` : name;
              })
              .join(', ')}
          </span>
        </span>
      )}
    </span>
  );
};
