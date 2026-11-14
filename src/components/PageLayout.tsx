import type { ReactNode } from 'react';
import { AppFooter } from '@/components/AppFooter';
import { cn } from '@/lib/cn';

export type PageLayoutWidth = 'default' | 'wide' | 'full';

export const PAGE_LAYOUT_WIDTH_CLASSES: Record<PageLayoutWidth, string> = {
  default: 'max-w-md md:max-w-3xl',
  wide: 'max-w-5xl',
  full: 'w-full',
};

export type PageLayoutProps = {
  /** Titolo testuale standard (utilizzato se headerSlot non è specificato) */
  title?: string;
  /** Slot per header personalizzato o toolbar complesse */
  headerSlot?: ReactNode;
  /** Rende l'header fisso in cima durante lo scroll (default: true) */
  headerSticky?: boolean;
  /** Variante strutturale: 'default' con contenimento o 'fullscreen' per mappe/edge-to-edge */
  variant?: 'default' | 'fullscreen';
  /** Larghezza massima del contenitore centrale (default: 'default' -> max-w-md md:max-w-3xl) */
  contentWidth?: PageLayoutWidth;
  /** Contenuto principale della pagina */
  children: ReactNode;
  /** Barra di azioni secondaria in fondo (RISERVATA a pagine prive di FloatingNav) */
  actionBar?: ReactNode;
  /** Rende l'action bar sticky sul fondo sopra la safe area (default: true) */
  actionBarSticky?: boolean;
  /** Visibilità del footer disclaimer/copyright (default: true per variant='default') */
  showCopyright?: boolean;
  /** Classi CSS addizionali applicate al wrapper radice */
  className?: string;
};

export const PageLayout = ({
  title,
  headerSlot,
  headerSticky = true,
  variant = 'default',
  contentWidth = 'default',
  children,
  actionBar,
  actionBarSticky = true,
  showCopyright,
  className = '',
}: PageLayoutProps) => {
  const shouldShowCopyright = showCopyright ?? (variant === 'default');

  if (variant === 'fullscreen') {
    return (
      <div className={cn('relative w-full h-dvh overflow-hidden flex flex-col', className)}>
        {headerSlot && (
          <header className={cn('z-20 shrink-0', headerSticky && 'sticky top-0')}>
            {headerSlot}
          </header>
        )}
        <main className="flex-1 relative w-full h-full overflow-hidden">
          {children}
        </main>
        {actionBar && (
          <div className={cn('z-30 shrink-0', actionBarSticky && 'sticky bottom-0 pb-safe')}>
            {actionBar}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('min-h-dvh flex flex-col bg-gray-50/50 dark:bg-black text-gray-900 dark:text-gray-100', className)}>
      {/* Header Slot o Titolo Standard */}
      {(headerSlot || title) && (
        <header
          className={cn(
            'z-20 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-all',
            headerSticky && 'sticky top-0'
          )}
        >
          <div className={cn('w-full mx-auto px-4 py-3 sm:px-6', PAGE_LAYOUT_WIDTH_CLASSES[contentWidth])}>
            {headerSlot ?? (
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {title}
                </h1>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={cn('flex-1 w-full mx-auto px-4 py-4 sm:px-6 pb-28', PAGE_LAYOUT_WIDTH_CLASSES[contentWidth])}>
        {children}
      </main>

      {/* Action Bar (Sticky o Statica) */}
      {actionBar && (
        <div
          className={cn(
            'z-30 w-full transition-all bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800',
            actionBarSticky && 'sticky bottom-0 pb-safe shadow-lg'
          )}
        >
          <div className={cn('w-full mx-auto px-4 py-3 sm:px-6', PAGE_LAYOUT_WIDTH_CLASSES[contentWidth])}>
            {actionBar}
          </div>
        </div>
      )}

      {/* Copyright Disclaimer Spinto sempre in Fondo */}
      {shouldShowCopyright && (
        <div className="mt-auto shrink-0 pb-safe">
          <AppFooter />
        </div>
      )}
    </div>
  );
};
