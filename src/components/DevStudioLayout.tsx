import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Monitor, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, GripVertical } from 'lucide-react';
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

const STORAGE_KEY = 'arc_benches_dev_studio_layout_v1';

export function DevStudioLayout({
  title,
  subtitle,
  icon,
  onBack,
  headerActions,
  sidebar,
  children,
  previewTitle,
  previewIcon,
  previewBadge,
  previewContent,
}: DevStudioLayoutProps) {
  // Load saved preferences
  const [layoutPrefs, setLayoutPrefs] = useState<{
    sidebarWidth: number;
    previewWidth: number;
    sidebarCollapsed: boolean;
    previewCollapsed: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      sidebarWidth: 300,
      previewWidth: 360,
      sidebarCollapsed: false,
      previewCollapsed: false,
    };
  });

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutPrefs));
    } catch {
      // ignore
    }
  }, [layoutPrefs]);

  // Resizing state
  const isDraggingSidebar = useRef(false);
  const isDraggingPreview = useRef(false);

  const startSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSidebar.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingSidebar.current) return;
      const newWidth = Math.max(200, Math.min(500, moveEvent.clientX));
      setLayoutPrefs(p => ({ ...p, sidebarWidth: newWidth, sidebarCollapsed: false }));
    };

    const onMouseUp = () => {
      isDraggingSidebar.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const startPreviewResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingPreview.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingPreview.current) return;
      const newWidth = Math.max(240, Math.min(650, window.innerWidth - moveEvent.clientX));
      setLayoutPrefs(p => ({ ...p, previewWidth: newWidth, previewCollapsed: false }));
    };

    const onMouseUp = () => {
      isDraggingPreview.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const toggleSidebar = () => {
    setLayoutPrefs(p => ({ ...p, sidebarCollapsed: !p.sidebarCollapsed }));
  };

  const togglePreview = () => {
    setLayoutPrefs(p => ({ ...p, previewCollapsed: !p.previewCollapsed }));
  };

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

        {/* Toolbar Azioni Globali e Toggles Layout */}
        <div className="flex items-center gap-2.5">
          {headerActions}

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

          {/* Toggle Sidebar Sinistra */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              layoutPrefs.sidebarCollapsed
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={layoutPrefs.sidebarCollapsed ? 'Espandi Sidebar (Elenco)' : 'Collassa Sidebar (Elenco)'}
          >
            {layoutPrefs.sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          {/* Toggle Anteprima Destra */}
          {previewContent && (
            <button
              type="button"
              onClick={togglePreview}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                layoutPrefs.previewCollapsed
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={layoutPrefs.previewCollapsed ? 'Espandi Anteprima JSON' : 'Collassa Anteprima JSON'}
            >
              {layoutPrefs.previewCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
            </button>
          )}
        </div>
      </header>

      {/* ── CORPO A COLONNE RESIDUABILI E COLLASSABILI ── */}
      <main className="flex-1 min-h-0 flex overflow-hidden">
        {/* COLONNA 1: SIDEBAR SINISTRA */}
        {!layoutPrefs.sidebarCollapsed && (
          <>
            <aside
              style={{ width: `${layoutPrefs.sidebarWidth}px` }}
              className="h-full overflow-hidden flex flex-col bg-white dark:bg-gray-900 shrink-0"
            >
              {sidebar}
            </aside>

            {/* SPLITTER DRAGGABILE 1 (SINISTRA) */}
            <div
              onMouseDown={startSidebarResize}
              className="w-1.5 hover:w-2 bg-gray-200 dark:bg-gray-800 hover:bg-purple-500 dark:hover:bg-purple-500 cursor-col-resize transition-all shrink-0 z-20 select-none group flex items-center justify-center"
              title="Trascina per ridimensionare la colonna"
            >
              <GripVertical size={10} className="text-gray-400 dark:text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        )}

        {/* COLONNA 2: AREA DI LAVORO CENTRALE */}
        <section className="flex-1 min-w-0 h-full overflow-y-auto p-8 bg-gray-50/50 dark:bg-black/50 space-y-6">
          {children}
        </section>

        {/* COLONNA 3: ANTEPRIMA LIVE CODICE / PREVIEW */}
        {previewContent && !layoutPrefs.previewCollapsed && (
          <>
            {/* SPLITTER DRAGGABILE 2 (DESTRA) */}
            <div
              onMouseDown={startPreviewResize}
              className="w-1.5 hover:w-2 bg-gray-800 hover:bg-purple-500 dark:hover:bg-purple-500 cursor-col-resize transition-all shrink-0 z-20 select-none group flex items-center justify-center"
              title="Trascina per ridimensionare l'anteprima"
            >
              <GripVertical size={10} className="text-gray-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <aside
              style={{ width: `${layoutPrefs.previewWidth}px` }}
              className="h-full overflow-hidden flex flex-col bg-gray-900 text-gray-300 shrink-0"
            >
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
          </>
        )}
      </main>
    </div>
  );
}

