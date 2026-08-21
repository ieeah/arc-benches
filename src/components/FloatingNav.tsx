import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  Backpack, LayoutList, ScrollText, Wrench, Database,
  ShieldAlert, Dice5, MoreHorizontal, Check, Users, X, Settings,
  ChevronRight, ChevronLeft, FlaskConical, FileJson, Languages
} from 'lucide-react';
import { useAppStore } from '@/store';
import { ProfilesDrawer } from '@/components/ProfilesDrawer';
import { useIsOverlayOpen } from '@/hooks/useOverlayCount';
import { useScrollLock } from '@/hooks/useScrollLock';

import { useTranslation } from '@/i18n';

const isDev = import.meta.env.DEV;

export type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  isCategory?: boolean;
  children?: NavItem[];
};

export type ContextAction = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  checked?: boolean;
  variant?: 'danger' | 'default';
  dividerBefore?: boolean;
};

export interface FloatingNavProps {
  activePage: string;
  onNavigate: (pageId: string) => void;
  contextActions: ContextAction[];
  items?: NavItem[];
  navSide?: 'left' | 'right';
}

export const FloatingNav = ({
  activePage,
  onNavigate,
  contextActions,
  items,
  navSide: navSideProp,
}: FloatingNavProps) => {
  const { t } = useTranslation();
  const storeNavSide = useAppStore(s => s.navSide);
  const navSide = navSideProp ?? storeNavSide;
  const isOverlayOpen = useIsOverlayOpen();

  const navTree: NavItem[] = useMemo(() => items ?? [
    { id: 'stash', label: t('nav.stash'), icon: <Backpack size={18} /> },
    { id: 'liste', label: t('nav.benches'), icon: <LayoutList size={18} /> },
    { id: 'blueprints', label: t('nav.blueprints'), icon: <ScrollText size={18} /> },
    {
      id: 'tools',
      label: t('nav.tools'),
      icon: <Wrench size={18} />,
      isCategory: true,
      children: [
        { id: 'vault', label: 'Vault Spedizione', icon: <ShieldAlert size={16} /> },
        { id: 'items', label: t('nav.catalog'), icon: <Database size={16} /> },
        { id: 'role-maker', label: 'Role Maker 🎲', icon: <Dice5 size={16} /> },
        ...(isDev ? [
          { id: 'dev-lab', label: 'Dev Catalog Lab 🧪', icon: <FlaskConical size={16} /> },
          { id: 'dev-overrides', label: 'Dev Overrides 🛠️', icon: <FileJson size={16} /> },
          { id: 'dev-translations', label: 'Dev i18n Studio 🌐', icon: <Languages size={16} /> },
        ] : []),
      ],
    },
    { id: 'settings', label: t('nav.settings'), icon: <Settings size={18} /> },
  ], [items, t]);

  // Pagine preferite per navigazione rapida (default: stash / liste)
  const quickFavorites = useAppStore(s => s.quickFavorites) ?? ['stash', 'liste'];

  // Switcher Profilo
  const activeProfileId = useAppStore(s => s.activeProfileId);
  const activeProfileName = useAppStore(
    s => s.profiles.find(p => p.id === s.activeProfileId)?.name ?? 'Principale'
  );

  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [profilesDrawerOpen, setProfilesDrawerOpen] = useState(false);

  // Menù di navigazione completo (aperto con long-press)
  const [menuOpen, setMenuOpen] = useState(false);
  useScrollLock(Boolean(menuOpen || contextMenuOpen), false);
  const [drillCategory, setDrillCategory] = useState<NavItem | null>(null);
  const [menuHeight, setMenuHeight] = useState<number | undefined>(undefined);

  const rootPaneRef = useRef<HTMLDivElement>(null);
  const subPaneRef = useRef<HTMLDivElement>(null);
  const mainBtnRef = useRef<HTMLButtonElement>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      setMenuHeight(undefined);
      return;
    }
    const targetEl = drillCategory !== null ? subPaneRef.current : rootPaneRef.current;
    if (targetEl) {
      setMenuHeight(targetEl.scrollHeight);
    }
  }, [menuOpen, drillCategory, navTree]);

  // Calcola la destinazione del tap rapido (alternanza tra le due preferite)
  const fav1 = quickFavorites[0] ?? 'stash';
  const fav2 = quickFavorites[1] ?? 'liste';
  const nextTargetPage = activePage === fav1 ? fav2 : fav1;

  // Trova l'item corrispondente alla destinazione rapida o attiva per l'icona
  const findItemById = (id: string, list: NavItem[]): NavItem | null => {
    for (const item of list) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(id, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const nextTargetItem = findItemById(nextTargetPage, navTree) ?? navTree[0];

  const triggerHaptic = (ms = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch { /* ignore */ }
    }
  };

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setContextMenuOpen(false);
    setDrillCategory(null);
    isLongPressRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  }, [setMenuOpen, setContextMenuOpen, setDrillCategory]);

  useEffect(() => {
    if (!menuOpen && !contextMenuOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen, contextMenuOpen, closeAll]);

  // --- GESTIONE POINTER: TAP SINGOLO = TOGGLE RAPIDO, LONG PRESS = MENU COMPLETO ---
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    isLongPressRef.current = false;

    // Timer per long-press: apre il menu completo
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setMenuOpen(true);
      setContextMenuOpen(false);
      triggerHaptic(25);
    }, 220);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    // Se non è stato un long-press, è un TAP SINGOLO: toggle tra le due pagine preferite!
    if (!isLongPressRef.current) {
      // Se il menu completo era già aperto, il click lo chiude
      if (menuOpen) {
        closeAll();
        return;
      }
      onNavigate(nextTargetPage);
      triggerHaptic(15);
    }
  };

  // Pulsante Secondario: ... (Menu Contestuale)
  const secondaryBtn = (
    <button
      key="secondary-btn"
      onClick={() => { setContextMenuOpen(!contextMenuOpen); setMenuOpen(false); }}
      className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
      aria-label="Opzioni e Profilo"
    >
      {contextMenuOpen ? <X size={20} /> : <MoreHorizontal size={22} />}
    </button>
  );

  // Pulsante Primario: Toggle Rapido al Tap / Menu Completo al Long-Press
  const primaryBtn = (
    <button
      key="primary-btn"
      ref={mainBtnRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={closeAll}
      className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition-all select-none touch-none cursor-pointer ${
        menuOpen
          ? 'bg-blue-600 scale-105 ring-4 ring-blue-400/40 shadow-blue-500/40'
          : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
      }`}
      aria-label={`Navigazione rapida a ${nextTargetItem.label} (Tieni premuto per il menu completo)`}
      title={`Vai a ${nextTargetItem.label} (Pressione prolungata per menu completo)`}
    >
      {nextTargetItem.icon}
    </button>
  );

  return (
    <>
      {(menuOpen || contextMenuOpen) && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 backdrop-blur-xs transition-opacity duration-200 pointer-events-auto overscroll-contain touch-none"
          onClick={closeAll}
        />
      )}

      <ProfilesDrawer
        isOpen={profilesDrawerOpen}
        onClose={() => setProfilesDrawerOpen(false)}
        from="bottom"
      />

      <div className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe flex justify-center transition-all duration-300 ${
        isOverlayOpen && !menuOpen && !contextMenuOpen ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
        <div className={`w-full max-w-md md:max-w-3xl flex ${navSide === 'right' ? 'justify-end pr-4' : 'justify-start pl-4'}`}>
          <div
            ref={pillRef}
            className="relative mb-6 flex items-center gap-3 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border border-gray-200/70 dark:border-gray-800 p-2 transition-all duration-200 pointer-events-auto"
          >

            {/* =================================================================== */}
            {/* 1. MENU DI NAVIGAZIONE COMPLETO (Aperto con Pressione Prolungata)    */}
            {/* =================================================================== */}
            {menuOpen && (
              <div
                className={`absolute bottom-full mb-3 w-64 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden select-none animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                  navSide === 'right' ? 'right-0' : 'left-0'
                }`}
              >
                {/* Header Scheda Navigazione */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between h-11">
                  {drillCategory !== null ? (
                    <button
                      onClick={() => setDrillCategory(null)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 active:scale-95 transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} /> {drillCategory.label}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tutte le Pagine</span>
                  )}
                </div>

                {/* Sliding Panes Container */}
                <div
                  className="relative overflow-hidden w-full transition-[height] duration-250 ease-out"
                  style={{
                    height: menuHeight !== undefined ? `${menuHeight}px` : 'auto',
                    maxHeight: '60vh',
                  }}
                >
                  <div
                    className={`flex items-start w-[200%] transition-transform duration-250 ease-out ${
                      drillCategory !== null ? '-translate-x-1/2' : 'translate-x-0'
                    }`}
                  >
                    {/* Pane 1: Root Menu */}
                    <div ref={rootPaneRef} className="w-1/2 shrink-0 p-2 space-y-0.5 overflow-y-auto max-h-[60vh]">
                      {navTree.map(item => {
                        const hasChildren = Boolean(item.children && item.children.length > 0);
                        const isSelected = item.id === activePage;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (hasChildren) {
                                setDrillCategory(item);
                                triggerHaptic(15);
                              } else {
                                onNavigate(item.id);
                                closeAll();
                                triggerHaptic(20);
                              }
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              {item.icon}
                              <span className="truncate">{item.label}</span>
                            </div>
                            {hasChildren && <ChevronRight size={14} className="opacity-60 shrink-0" />}
                            {isSelected && !hasChildren && <Check size={14} className="shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pane 2: Sub-category Menu */}
                    <div ref={subPaneRef} className="w-1/2 shrink-0 p-2 space-y-0.5 overflow-y-auto max-h-[60vh]">
                      {(drillCategory?.children ?? []).map(item => {
                        const isSelected = item.id === activePage;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onNavigate(item.id);
                              closeAll();
                              triggerHaptic(20);
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              {item.icon}
                              <span className="truncate">{item.label}</span>
                            </div>
                            {isSelected && <Check size={14} className="shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 2. MENU CONTESTUALE (...)                                           */}
            {/* =================================================================== */}
            {contextMenuOpen && (
              <div
                className={`absolute bottom-full mb-3 w-64 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[75dvh] animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                  navSide === 'right' ? 'right-0' : 'left-0'
                }`}
              >
                {/* 1. SWITCHER PROFILO IN CIMA (Apre il Drawer Profili al tocco sulla card) */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Users size={12} className="text-purple-500" /> {t('nav.profile')}
                    </span>
                  </div>

                  <button
                    onClick={() => { setProfilesDrawerOpen(true); setContextMenuOpen(false); }}
                    className="w-full flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left cursor-pointer"
                  >
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate">{activeProfileName}</span>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono px-1.5 py-0.5 rounded-full">ID: {activeProfileId.slice(0, 4)}</span>
                  </button>
                </div>

                {/* 2. AZIONI CONTESTUALI DELLA PAGINA ATTIVA */}
                <div className="p-2 flex-1 overflow-y-auto space-y-0.5">
                  <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('benches.actions')}</p>
                  {contextActions.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400 italic">{t('common.none')}</p>
                  ) : (
                    contextActions.map((action, i) => (
                      <div key={i}>
                        {action.dividerBefore && <div className="mx-3 my-1 h-px bg-gray-100 dark:bg-gray-800" />}
                        <button
                          onClick={() => { action.onClick(); closeAll(); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            action.variant === 'danger'
                              ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {action.icon}
                          <span className="flex-1">{action.label}</span>
                          {action.checked !== undefined && (
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              action.checked ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {action.checked && <Check size={10} />}
                            </div>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* BOTTONI PILL (Invertiti per mano sinistra) */}
            {navSide === 'right' ? (
              <>
                {secondaryBtn}
                {primaryBtn}
              </>
            ) : (
              <>
                {primaryBtn}
                {secondaryBtn}
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
};
