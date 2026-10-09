import type { PassList } from '@/types';
import { useTranslation, getListDescription, getListName } from '@/i18n';
import { PassRewardsSummary } from '@/components/pass/PassRewardsSummary';
import { getTrackName } from '@/lib/rewardPass';

/**
 * Riepilogo di un pass nella pagina di anteprima: nome e costo del premium, descrizione, livelli e tracce,
 * ricompense totali. Condiviso tra la pagina del pass e l'anteprima della pagina Dev.
 */
export const PassDetailSummary = ({ pass }: { pass: PassList }) => {
  const { t, language } = useTranslation();
  const description = getListDescription(pass, language);

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-black">{getListName(pass, language)}</h2>
        {pass.premiumCostTokens !== undefined && (
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
            {t('rewardPass.premiumCost', { cost: pass.premiumCostTokens.toLocaleString(language) })}
          </span>
        )}
      </div>

      {description && <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('rewardPass.levels')}</p>
          <p className="text-xl font-black">{pass.maxLevel}</p>
        </div>
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('rewardPass.tracks')}</p>
          <p className="text-sm font-black leading-tight pt-1">{pass.tracks.map((tr) => getTrackName(tr, language)).join(' · ')}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('rewardPass.totalRewards')}</p>
        <PassRewardsSummary pass={pass} />
      </div>
    </section>
  );
};
