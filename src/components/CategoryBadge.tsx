import React from 'react';
import { getCategoryIconPath } from '@/lib/categoryIcons';

export interface CategoryBadgeProps {
  itemType?: string | null;
  subcategory?: string | null;
  className?: string;
  /** Ignorato quando `bare` è true: l'icona riempie l'altezza del contenitore invece
   * di usare una delle taglie fisse. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  /** Se true, mostra solo l'icona senza il chip (sfondo/bordo/blur) che la racchiude —
   * utile quando il badge siede già su uno sfondo proprio (es. ItemCardFrameV2).
   * L'icona riempie l'altezza del contenitore (vedi `size`). */
  bare?: boolean;
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
  bare = false,
}) => {
  const iconPath = getCategoryIconPath(itemType, subcategory);
  if (!iconPath) return null;
  const label = subcategory || itemType;

  if (bare) {
    // Nessuna taglia Tailwind fissa: riempie l'altezza del contenitore (il chiamante
    // la clampa in modo responsive, es. ItemCardFrameV2), non un valore assoluto —
    // altrimenti la stessa icona risulta sproporzionata su card di taglie diverse.
    return (
      <img
        src={iconPath}
        alt={label || 'Category'}
        title={label || undefined}
        loading="lazy"
        decoding="async"
        className={`h-full w-auto max-w-full object-contain filter drop-shadow-xs select-none ${className}`}
      />
    );
  }

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
