import { Lock, Check } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/cn';

/**
 * Requisiti di un livello su altre liste («Richiede Outpost Lvl 2»): ambra finché non sono soddisfatti,
 * verdi quando lo sono. Sono condizioni derivate, non azioni da spuntare.
 */
export const RequirementChips = ({
  requirements,
  className,
}: {
  requirements: { name: string; level: number; met: boolean }[];
  className?: string;
}) => {
  const { t } = useTranslation();
  if (requirements.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {requirements.map((req) => (
        <span
          key={`${req.name}-${req.level}`}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
            req.met
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
          )}
        >
          {req.met ? <Check size={10} strokeWidth={3} /> : <Lock size={10} />}
          {t('requires.chip', { name: req.name, level: String(req.level) })}
        </span>
      ))}
    </div>
  );
};
