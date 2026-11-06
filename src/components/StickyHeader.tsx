import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type StickyHeaderProps = {
  children: ReactNode;
  /** Padding ridotto in basso (pagine con controlli compatti). */
  compact?: boolean;
  /** Sopra gli altri sticky della pagina (z-30 invece di z-20). */
  elevated?: boolean;
  className?: string;
}

/**
 * Intestazione fissa delle pagine. Sfondo opaco di proposito: un `backdrop-blur` su un elemento
 * sticky obbliga il browser a ricalcolare la sfocatura a ogni frame di scroll, causa di scatti
 * sui dispositivi Android di fascia media.
 */
export const StickyHeader = ({ children, compact = false, elevated = false, className }: StickyHeaderProps) => (
  <div
    className={cn(
      'sticky top-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800',
      compact ? 'px-4 pt-4 pb-3' : 'p-4',
      elevated ? 'z-30' : 'z-20',
      className,
    )}
  >
    {children}
  </div>
);
