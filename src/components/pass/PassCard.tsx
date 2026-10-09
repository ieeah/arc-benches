import { ChevronRight, Ticket } from 'lucide-react';
import type { PassList } from '@/types';
import { useTranslation, getListName } from '@/i18n';
import { getTrackName } from '@/lib/rewardPass';
import { cn } from '@/lib/cn';

interface PassCardProps {
  pass: PassList;
  onOpen: () => void;
  /** Pass già concluso: card più discreta, con la data di conclusione. */
  completedAt?: string;
  /** Pass attivo del profilo: mostra l'etichetta «Pass attivo». */
  active?: boolean;
}

/** Card di un pass nell'elenco di selezione: porta alla pagina di anteprima. */
export const PassCard = ({ pass, onOpen, completedAt, active = false }: PassCardProps) => {
  const { t, language } = useTranslation();
  const completed = completedAt !== undefined;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'w-full p-4 text-left rounded-[24px] border flex items-center gap-3 transition-colors cursor-pointer',
        completed
          ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs',
      )}
    >
      <span className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', completed ? 'bg-gray-200 dark:bg-gray-800' : 'bg-purple-100 dark:bg-purple-950/50')}>
        <Ticket size={20} className={completed ? 'text-gray-500' : 'text-purple-600 dark:text-purple-300'} />
      </span>
      <span className="flex-1 min-w-0 space-y-1">
        <span className="block text-sm font-black truncate">{getListName(pass, language)}</span>
        <span className="block text-[11px] text-gray-500 dark:text-gray-400">
          {t('rewardPass.levelsCount', { count: String(pass.maxLevel) })} · {pass.tracks.map((tr) => getTrackName(tr, language)).join(' / ')}
          {pass.premiumCostTokens !== undefined && ` · ${t('rewardPass.premiumCost', { cost: pass.premiumCostTokens.toLocaleString(language) })}`}
        </span>
        {active && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white">
            {t('rewardPass.active')}
          </span>
        )}
        {completed && (
          <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {t('rewardPass.completedOn', { date: new Date(completedAt).toLocaleDateString(language) })}
          </span>
        )}
      </span>
      <ChevronRight size={18} className="text-gray-400 shrink-0" />
    </button>
  );
};
