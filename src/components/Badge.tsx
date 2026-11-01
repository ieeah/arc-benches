import React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'sky' | 'emerald' | 'amber' | 'violet' | 'red' | 'gray' | 'neutral';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  sky: 'bg-sky-500 dark:bg-sky-600 text-white',
  emerald: 'bg-emerald-500 dark:bg-emerald-600 text-white',
  amber: 'bg-amber-500 dark:bg-amber-600 text-white',
  violet: 'bg-violet-500 dark:bg-violet-600 text-white',
  red: 'bg-red-500 dark:bg-red-600 text-white',
  gray: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  neutral: 'bg-gray-500 text-white',
};

const SIZE_STYLES: Record<BadgeSize, { container: string; iconOffset: string }> = {
  xs: {
    container: 'gap-0.5 px-1 py-0.2 text-[6.5px]',
    iconOffset: '-translate-y-[0.5px]',
  },
  sm: {
    container: 'gap-1 px-1.5 py-0.5 text-[7.5px]',
    iconOffset: '-translate-y-[0.5px]',
  },
  md: {
    container: 'gap-1.5 px-2 py-0.5 text-[8.5px]',
    iconOffset: '-translate-y-[0.5px]',
  },
};

/**
 * Componente base Badge per pillole informative (es. Refiner, Trader, Status).
 * Garantisce allineamento e centratura perfetta tra icona e testo, e proporzioni consistenti.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'sky',
  size = 'md',
  icon,
  children,
  title,
  className,
  ...props
}) => {
  const { container, iconOffset } = SIZE_STYLES[size];

  return (
    <div
      title={title}
      className={cn(
        'inline-flex items-center justify-center leading-none rounded-full font-bold tracking-wide shadow-xs shrink-0 select-none',
        VARIANT_STYLES[variant],
        container,
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn('shrink-0 flex items-center justify-center', iconOffset)} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="leading-none flex items-center truncate">
        {children}
      </span>
    </div>
  );
};
