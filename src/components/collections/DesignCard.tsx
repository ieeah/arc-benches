import React from 'react';
import type { ItemInfo } from '@/types';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useTranslation, getItemName } from '@/i18n';
import { getFurnitureCategory } from '@/lib/collections';

export type DesignCardProps = {
  design: ItemInfo;
  itemsInfo: Record<string, ItemInfo>;
  isOwned: boolean;
  onToggleOwned: () => void;
};

export const DesignCard: React.FC<DesignCardProps> = ({
  design,
  itemsInfo,
  isOwned,
  onToggleOwned,
}) => {
  const { t, language } = useTranslation();
  const targetItem = design.unlocks_item_id ? itemsInfo[design.unlocks_item_id] : null;
  const displayItem = targetItem || design;
  const displayName = getItemName(displayItem, language).replace(/\s*Design\s*/i, '');
  const categoryKey = getFurnitureCategory(design, itemsInfo);
  const categoryLabel = t(`collections.categories.${categoryKey}`);

  return (
    <div
      role="checkbox"
      aria-checked={isOwned}
      tabIndex={0}
      onClick={onToggleOwned}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggleOwned();
        }
      }}
      className={`flex flex-col transition-all cursor-pointer select-none active:scale-[0.98] group ${
        isOwned ? 'opacity-50 grayscale-[0.35]' : 'hover:scale-[1.02]'
      }`}
    >
      <div className="relative aspect-square min-h-0">
        <ItemCardFrameV2
          icon={displayItem.icon || design.icon}
          alt={displayName}
          rarity={design.rarity || displayItem.rarity}
          itemType="Design"
          completed={isOwned}
          className="w-full h-full shadow-inner"
          borderRadius={18}
          categoryBadge={<CategoryBadge itemType="Design" bare />}
          topRightSlot={
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs border border-white/10 uppercase tracking-wider">
              {categoryLabel}
            </span>
          }
        />
      </div>

      <div className="min-w-0 text-center pt-1.5 px-0.5">
        <h4 className="text-xs sm:text-[13px] font-semibold truncate capitalize leading-tight text-gray-800 dark:text-gray-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
          {displayName}
        </h4>
      </div>
    </div>
  );
};
