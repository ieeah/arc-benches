import type { ReactNode } from 'react';
import { AppFooter } from '@/components/AppFooter';

export type PageLayoutProps = {
  /** Testo o titolo della pagina */
  title?: string;
  /** Slot opzionale per header personalizzato (o controlli a destra) */
  headerSlot?: ReactNode;
  /** Rende l'header sticky in cima (default: true) */
  headerSticky?: boolean;
  /** Variante del layout: 'default' con header standard e footer o 'fullscreen' per viste edge-to-edge (es. mappe) */
  variant?: 'default' | 'fullscreen';
  /** Contenuto principale della pagina */
  children: ReactNode;
  /** Action bar opzionale (es. pulsanti di azione in fondo) */
  actionBar?: ReactNode;
  /** Rende l'action bar sticky/incollata in fondo alla finestra (default: true se actionBar è presente) */
  actionBarSticky?: boolean;
  /** Mostrare o meno il footer di disclaimer/copyright (default: true per default, false per fullscreen) */
  showCopyright?: boolean;
  /** Classi CSS aggiuntive per il container o il wrapper principale */
  className?: string;
};

export const PageLayout = ({
  title,
  headerSlot,
  headerSticky = true,
  variant = 'default',
  children,
  actionBar,
  actionBarSticky = true,
  showCopyright,
  className = '',
}: PageLayoutProps) => {
  const shouldShowCopyright = showCopyright ?? (variant === 'default');

  if (variant === 'fullscreen') {
    return (
      <div className={`relative w-full h-dvh overflow-hidden flex flex-col ${className}`}>
        {headerSlot && (
          <header className={`z-20 shrink-0 ${headerSticky ? 'sticky top-0' : ''}`}>
            {headerSlot}
          </header>
        )}
        <main className="flex-1 relative w-full h-full overflow-hidden">
          {children}
        </main>
        {actionBar && (
          <div className={`z-30 shrink-0 ${actionBarSticky ? 'sticky bottom-0 pb-safe' : ''}`}>
            {actionBar}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-dvh flex flex-col bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 ${className}`}>
      {/* Header Slot o Titolo Standard */}
      {(headerSlot || title) && (
        <header
          className={`z-20 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-3 sm:px-6 transition-all ${
            headerSticky ? 'sticky top-0' : ''
          }`}
        >
          {headerSlot ?? (
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {title}
              </h1>
            </div>
          )}
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-5 sm:px-6 pb-24">
        {children}
      </main>

      {/* Action Bar (Sticky o Statica) */}
      {actionBar && (
        <div
          className={`z-30 w-full transition-all ${
            actionBarSticky
              ? 'sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800/80 px-4 py-3 sm:px-6 pb-safe shadow-lg'
              : 'px-4 py-3 sm:px-6'
          }`}
        >
          <div className="max-w-4xl mx-auto">
            {actionBar}
          </div>
        </div>
      )}

      {/* Copyright Disclaimer Spinto sempre in Fondo */}
      {shouldShowCopyright && (
        <div className="mt-auto shrink-0">
          <AppFooter />
        </div>
      )}
    </div>
  );
};
