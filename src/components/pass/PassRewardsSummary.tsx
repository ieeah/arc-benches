import { useMemo } from 'react';
import type { PassList } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';
import { RewardBadge } from '@/components/RewardBadge';
import { summarizePassRewards } from '@/lib/rewardPass';

/** Ricompense totali di un pass: valute per oggetto e il resto per tipo (blueprint, outfit…). */
export const PassRewardsSummary = ({ pass }: { pass: PassList }) => {
  const { t } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const summary = useMemo(() => summarizePassRewards(pass, itemsInfo), [pass, itemsInfo]);

  if (summary.total === 0) {
    return <p className="text-xs text-gray-400">{t('rewardPass.noRewardsYet')}</p>;
  }

  return (
    <div className="space-y-2">
      {summary.currencies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {summary.currencies.map((c) => (
            <RewardBadge key={c.itemId} reward={{ itemId: c.itemId, quantity: c.quantity }} size="sm" />
          ))}
        </div>
      )}
      {summary.types.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {summary.types.map((entry) => (
            <span
              key={entry.type}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {entry.type} <span className="font-mono text-violet-600 dark:text-violet-400">×{entry.quantity}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
