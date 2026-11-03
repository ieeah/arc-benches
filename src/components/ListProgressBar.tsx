import { memo } from 'react';
import type { ListProgress } from '@/lib/lists';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/cn';

export type ListProgressBarProps = {
  progress: ListProgress;
  isCustom?: boolean;
  listName?: string;
  className?: string;
};

export const ListProgressBar = memo(function ListProgressBar({
  progress,
  isCustom = false,
  listName = '',
  className,
}: ListProgressBarProps) {
  const { t } = useTranslation();

  const { isMaxed, canUpgrade, currentLevel, maxLevel, overallPercent, nextLevelPercent, segments } = progress;

  const ariaLabel = isMaxed
    ? t('lists.progressBarLabelMaxed', { name: listName, max: maxLevel })
    : canUpgrade
    ? t('lists.progressBarLabelReady', { name: listName, current: currentLevel, max: maxLevel })
    : t('lists.progressBarLabel', { name: listName, current: currentLevel, max: maxLevel, percent: nextLevelPercent });

  const activeColor = isCustom ? 'bg-violet-500' : 'bg-blue-500';
  const completedColor = isMaxed ? 'bg-emerald-500' : activeColor;

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={overallPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('flex items-center gap-1 w-full min-w-0 py-0.5', className)}
    >
      {segments.map(seg => {
        if (seg.status === 'completed') {
          return (
            <div
              key={seg.level}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors duration-300',
                completedColor
              )}
            />
          );
        }

        if (seg.status === 'ready') {
          return (
            <div
              key={seg.level}
              className="flex-1 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse transition-all duration-300"
            />
          );
        }

        if (seg.status === 'in-progress') {
          return (
            <div
              key={seg.level}
              className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700/60 overflow-hidden"
            >
              <div
                style={{ width: `${seg.percent}%` }}
                className={cn(
                  'h-full rounded-full transition-all duration-300 ease-out',
                  activeColor
                )}
              />
            </div>
          );
        }

        // status === 'future'
        return (
          <div
            key={seg.level}
            className="flex-1 h-1.5 rounded-full bg-gray-150 dark:bg-gray-800/80 bg-gray-200/50"
          />
        );
      })}
    </div>
  );
});
