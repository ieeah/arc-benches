import React from 'react';
import { ArrowLeft, Monitor } from 'lucide-react';
import { IconButton } from '@/components/IconButton';

export interface DevStudioLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
  onBack: () => void;
  headerActions?: React.ReactNode;
  sidebarWidth?: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  previewWidth?: string;
  previewTitle?: string;
  previewIcon?: React.ReactNode;
  previewBadge?: React.ReactNode;
  previewContent?: React.ReactNode;
}

export function DevStudioLayout({
  title,
  subtitle,
  icon,
  onBack,
  headerActions,
  sidebarWidth = 'col-span-3',
  sidebar,
  children,
  previewWidth = 'col-span-3',
  previewTitle,
  previewIcon,
  previewBadge,
  previewContent,
}: DevStudioLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col">
      {/* ── AVVISO PER SCHERMI PICCOLI (DESKTOP ONLY REQUIREMENT) ── */}
      <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/95 text-white flex flex-col items-center justify-center p-6 text-center">
        <Monitor size={48} className="text-amber-400 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Dashboard Solo per Desktop</h2>
        <p className="text-sm text-gray-300 max-w-sm mb-6">
          Questo strumento per sviluppatori è ottimizzato esclusivamente per schermi Desktop (risoluzione &ge; 1024px).
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 font-bold text-sm rounded-2xl flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} /> Torna all'App
        </button>
      </div>

      {/* ── HEADER SUPERIORE ── */}
      <header className="shrink-0 px-6 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <IconButton onClick={onBack} title="Torna all'App">
            <ArrowLeft size={18} />
          </IconButton>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                {icon}
                {title}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Dev Only
              </span>
            </div>
            {subtitle && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Toolbar Azioni Globali */}
        {headerActions && (
          <div className="flex items-center gap-2.5">
            {headerActions}
          </div>
        )}
      </header>

      {/* ── CORPO A COLONNE (DESKTOP GRID) ── */}
      <main className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">
        {/* COLONNA 1: SIDEBAR SINISTRA */}
        <aside className={`${sidebarWidth} h-full overflow-hidden border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900`}>
          {sidebar}
        </aside>

        {/* COLONNA 2: AREA DI LAVORO CENTRALE */}
        <section className={`flex-1 h-full overflow-y-auto ${previewContent ? 'col-span-6' : 'col-span-9'} p-8 bg-gray-50/50 dark:bg-black/50 space-y-6`}>
          {children}
        </section>

        {/* COLONNA 3: ANTEPRIMA LIVE CODICE / PREVIEW */}
        {previewContent && (
          <aside className={`${previewWidth} h-full overflow-hidden flex flex-col bg-gray-900 text-gray-300 border-l border-gray-800`}>
            {previewTitle && (
              <div className="shrink-0 p-3 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-gray-400 flex items-center gap-1.5">
                  {previewIcon}
                  {previewTitle}
                </span>
                {previewBadge && (
                  <span className="text-[10px] text-gray-500 font-mono">
                    {previewBadge}
                  </span>
                )}
              </div>
            )}
            <div className="flex-1 min-h-0 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-400 select-all">
              {previewContent}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
