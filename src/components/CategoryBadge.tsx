import React from 'react';
import { getCategoryIconPath } from '@/lib/categoryIcons';

export interface CategoryBadgeProps {
  itemType?: string | null;
  subcategory?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  xs: 'w-4 h-4 p-0.5',
  sm: 'w-5 h-5 p-0.5',
  md: 'w-6 h-6 p-0.5',
  lg: 'w-8 h-8 p-1',
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  itemType,
  subcategory,
  className = '',
  size = 'sm',
  showLabel = false,
}) => {
  const iconPath = getCategoryIconPath(itemType, subcategory);
  if (!iconPath) return null;
  const label = subcategory || itemType;

  return (
    <div
      title={label || undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-black/45 backdrop-blur-xs border border-white/15 shadow-xs select-none ${sizeClasses[size]} ${className}`}
    >
      <img
        src={iconPath}
        alt={label || 'Category'}
        className="w-full h-full object-contain filter drop-shadow-xs"
        loading="lazy"
        decoding="async"
      />
      {showLabel && label && (
        <span className="text-xs font-semibold text-white/90 pr-1.5 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};
