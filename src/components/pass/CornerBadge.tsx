import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Spilla circolare da angolo di una card ricompensa (lucchetto della traccia, tipo di pezzo outfit):
 * stessa dimensione e stile, senza bordi; cambia solo colore e simbolo. A cavallo del bordo della card.
 */
export const CornerBadge = ({ children, className, title }: { children: ReactNode; className: string; title?: string }) => (
  <span title={title} className={cn('w-5 h-5 rounded-full flex items-center justify-center shadow-sm', className)}>
    {children}
  </span>
);
