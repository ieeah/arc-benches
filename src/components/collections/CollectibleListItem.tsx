import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';

export type CollectibleListItemProps = {
  title: string;
  subtitle?: string;
  icon?: string | null;
  rarity?: string;
  badge?: React.ReactNode;
  itemType?: string | null;
  isOwned: boolean;
  onToggle: () => void;
};

export const CollectibleListItem: React.FC<CollectibleListItemProps> = ({
  title,
  subtitle,
  icon,
  rarity,
  badge,
  itemType,
  isOwned,
  onToggle,
}) => {
  return (
    <div
      role="checkbox"
      aria-checked={isOwned}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all cursor-pointer select-none active:scale-[0.99] group shadow-xs ${
        isOwned ? 'opacity-50 grayscale-[0.3]' : 'hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 aspect-square rounded-xl overflow-hidden">
        <ItemCardFrameV2
          icon={icon}
          alt={title}
          rarity={rarity}
          itemType={itemType}
          completed={false}
          compact
          thumb
          borderRadius={12}
          className="w-full h-full"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h4>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </p>
        )}
      </div>

      <div className="shrink-0 pl-1">
        {isOwned ? (
          <CheckCircle2 size={22} className="text-emerald-500" />
        ) : (
          <Circle size={22} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400" />
        )}
      </div>
    </div>
  );
};
