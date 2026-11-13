import React from 'react';
import {
  ScrollableFadeContainer,
  type ScrollableBleedType,
} from '@/components/ScrollableFadeContainer';

export type { ScrollableBleedType };
export { ScrollableFadeContainer };

export type PillItem = {
  id: string;
  label: string;
  count?: number;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  indicator?: React.ReactNode;
  ariaLabel?: string;
};

export type ScrollablePillListProps = {
  items: PillItem[];
  bleedType?: ScrollableBleedType;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: (item: PillItem) => string;
};

/**
 * Lista di bottoni a pillola orizzontale scorrevole con affordance visiva,
 * navigazione accessibile da tastiera e supporto touch-first nativo.
 */
export const ScrollablePillList = ({
  items,
  bleedType = 'full',
  ariaLabel,
  className = '',
  buttonClassName,
}: ScrollablePillListProps) => {
  return (
    <ScrollableFadeContainer
      bleedType={bleedType}
      wrapperClassName={className}
      containerClassName="gap-1.5"
      role="group"
      ariaLabel={ariaLabel}
    >
      {items.map(item => {
        const customClass = buttonClassName ? buttonClassName(item) : '';
        const isStartIcon = item.iconPosition === 'start';

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.isSelected}
            aria-disabled={item.isDisabled}
            aria-label={item.ariaLabel}
            onClick={() => !item.isDisabled && item.onClick()}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
              item.isSelected
                ? 'bg-blue-600 text-white shadow-sm cursor-default'
                : item.isDisabled
                  ? 'bg-gray-150/80 dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-gray-300/40 dark:border-gray-800/80 cursor-not-allowed'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer'
            } ${customClass}`.trim()}
          >
            {isStartIcon && item.icon}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="text-[10px] font-bold opacity-60">({item.count})</span>
            )}
            {item.indicator}
            {!isStartIcon && item.icon}
          </button>
        );
      })}
    </ScrollableFadeContainer>
  );
};
