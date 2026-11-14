import React from 'react';
import type { ItemInfo } from '@/types';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useTranslation, getItemName } from '@/i18n';

export type StencilCardProps = {
  stencil: ItemInfo;
  isOwned: boolean;
  onToggleOwned: () => void;
};

export const StencilCard: React.FC<StencilCardProps> = ({
  stencil,
  isOwned,
  onToggleOwned,
}) => {
  const { language } = useTranslation();
  const displayName = getItemName(stencil, language).replace(/\s*Stencil\s*/i, '');

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
          icon={stencil.icon}
          alt={displayName}
          rarity={stencil.rarity}
          completed={isOwned}
          className="w-full h-full shadow-inner"
          borderRadius={18}
          categoryBadge={<CategoryBadge itemType="Stencil" bare />}
        />
      </div>

      <div className="min-w-0 text-center pt-1.5 px-0.5">
        <h4 className="text-xs sm:text-[13px] font-semibold truncate capitalize leading-tight text-gray-800 dark:text-gray-200 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
          {displayName}
        </h4>
      </div>
    </div>
  );
};
