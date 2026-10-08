import React from 'react';
import type { Reward } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getItemName } from '@/i18n';
import { getRarityStyles } from '@/lib/rarity';
import { iconUrl } from '@/lib/icons';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

export interface RewardBadgeProps {
  reward: Reward;
  size?: 'xs' | 'sm' | 'md';
  obtained?: boolean;
  className?: string;
}

export const RewardBadge: React.FC<RewardBadgeProps> = ({
  reward,
  size = 'xs',
  obtained = false,
  className,
}) => {
  const { language } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);

  const info = itemsInfo[reward.itemId];
  const name = info ? getItemName(info, language) || reward.itemId : reward.itemId;
  const { color } = getRarityStyles(info?.rarity ?? '');

  if (size === 'md') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 bg-violet-50/50 dark:bg-violet-950/20 px-2.5 py-1.5 rounded-xl border border-violet-100 dark:border-violet-900/30 transition-opacity',
          obtained && 'opacity-70',
          className,
        )}
      >
        <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 border border-violet-200 dark:border-violet-800/40">
          {info?.icon ? (
            <img
              src={iconUrl(info.icon, true)}
              alt={name}
              loading="lazy"
              decoding="async"
              className="max-w-[85%] max-h-[85%] object-contain"
            />
          ) : (
            <span className="text-xs">🎁</span>
          )}
          {info && (
            <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', color)} />
          )}
        </div>
        <span className="flex-1 min-w-0 text-xs font-semibold truncate text-gray-800 dark:text-gray-200">
          {name}
        </span>
        {reward.quantity && (
          <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 shrink-0">
            x{reward.quantity}
          </span>
        )}
        {obtained && (
          <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-0.5 font-bold shrink-0">
            <Check size={11} strokeWidth={3} />
          </span>
        )}
      </div>
    );
  }

  // xs or sm
  const isXs = size === 'xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium select-none shrink-0 rounded-lg border transition-all',
        isXs
          ? 'px-1.5 py-0.5 text-[10px]'
          : 'px-2 py-0.8 text-xs',
        obtained
          ? 'bg-green-50/60 dark:bg-green-950/30 border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300 opacity-80'
          : 'bg-violet-50/80 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/50 text-violet-800 dark:text-violet-300',
        className,
      )}
      title={name}
    >
      <span className="relative flex items-center justify-center shrink-0">
        {info?.icon ? (
          <span className="w-3.5 h-3.5 relative flex items-center justify-center">
            <img
              src={iconUrl(info.icon, true)}
              alt={name}
              loading="lazy"
              decoding="async"
              className="max-w-full max-h-full object-contain"
            />
          </span>
        ) : (
          <span className="text-[10px] leading-none">🎁</span>
        )}
      </span>
      <span className="truncate max-w-28 sm:max-w-40">{name}</span>
      {reward.quantity && (
        <span
          className={cn(
            'font-mono font-bold shrink-0',
            obtained
              ? 'text-green-600 dark:text-green-400'
              : 'text-violet-600 dark:text-violet-400',
          )}
        >
          x{reward.quantity}
        </span>
      )}
      {obtained && (
        <Check size={10} strokeWidth={3} className="text-green-600 dark:text-green-400 shrink-0" />
      )}
    </span>
  );
};
