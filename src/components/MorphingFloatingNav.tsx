import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Backpack, LayoutList, ScrollText, Wrench, Database,
  ShieldAlert, Dice5, MoreHorizontal, Check, Users, X, Settings,
  ChevronRight, ChevronLeft, FlaskConical, FileJson, Languages
} from 'lucide-react';
import { useAppStore } from '@/store';
import { ProfilesDrawer } from '@/components/ProfilesDrawer';
import { useIsOverlayOpen } from '@/hooks/useOverlayCount';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTranslation } from '@/i18n';
import type { NavItem, FloatingNavProps } from '@/components/FloatingNav';

const isDev = import.meta.env.DEV;

type MorphMode = 'idle' | 'nav' | 'context';

export const MorphingFloatingNav = ({
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
  const isReducedMotion = useReducedMotion();

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

  const quickFavorites = useAppStore(s => s.quickFavorites) ?? ['stash', 'liste'];
  const activeProfileId = useAppStore(s => s.activeProfileId);
  const activeProfileName = useAppStore(
    s => s.profiles.find(p => p.id === s.activeProfileId)?.name ?? 'Principale'
  );

  const [mode, setMode] = useState<MorphMode>('idle');
  const [profilesDrawerOpen, setProfilesDrawerOpen] = useState(false);
  const [drillCategory, setDrillCategory] = useState<NavItem | null>(null);

  const isOpen = mode !== 'idle';
  useScrollLock(isOpen, false);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rootPaneRef = useRef<HTMLDivElement>(null);
  const subPaneRef = useRef<HTMLDivElement>(null);
  const contextPaneRef = useRef<HTMLDivElement>(null);
  const mainBtnRef = useRef<HTMLButtonElement>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  // Calcolo dinamico dell'altezza del container per il morphing fluido ad ogni sottomenu/sezione
  const [dynamicHeight, setDynamicHeight] = useState<number>(68);

  useEffect(() => {
    if (mode === 'idle') {
      setDynamicHeight(68);
      return;
    }

    // Piccolo rinvio per consentire al DOM di montare il pannello attivo
    const measure = () => {
      const headerH = headerRef.current?.offsetHeight ?? 44;
      let bodyH = 0;

      if (mode === 'nav') {
        const activePane = drillCategory !== null ? subPaneRef.current : rootPaneRef.current;
        if (activePane) {
          bodyH = activePane.scrollHeight;
        }
      } else if (mode === 'context') {
        if (contextPaneRef.current) {
          bodyH = contextPaneRef.current.scrollHeight;
        }
      }

      // Padding container (20px) + Header + Body
      const total = headerH + bodyH + 22;
      const maxAllowed = typeof window !== 'undefined' ? window.innerHeight * 0.75 : 500;
      setDynamicHeight(Math.min(maxAllowed, Math.max(120, total)));
    };

    measure();
    const timer = setTimeout(measure, 10);
    return () => clearTimeout(timer);
  }, [mode, drillCategory, navTree, contextActions]);

  const fav1 = quickFavorites[0] ?? 'stash';
  const fav2 = quickFavorites[1] ?? 'liste';
  const nextTargetPage = activePage === fav1 ? fav2 : fav1;

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

  const closeMenu = useCallback(() => {
    setMode('idle');
    setDrillCategory(null);
    isLongPressRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, closeMenu]);

  // Gestione Pointer per Tap Singolo (Toggle) vs Long Press (Morph Nav)
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isLongPressRef.current = false;

    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setMode('nav');
      triggerHaptic(30);
    }, 220);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    if (!isLongPressRef.current) {
      if (isOpen) {
        closeMenu();
        return;
      }
      onNavigate(nextTargetPage);
      triggerHaptic(15);
    }
  };

  // Switch to context mode
  const handleToggleContextMenu = () => {
    if (mode === 'context') {
      closeMenu();
    } else {
      setMode('context');
      setDrillCategory(null);
      triggerHaptic(20);
    }
  };

  const isAnchorRight = navSide === 'right';

  return (
    <>
      {/* Backdrop scuro quando il contenitore è morfato in pannello aperto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto overscroll-contain touch-none"
          onClick={closeMenu}
        />
      )}

      <ProfilesDrawer
        isOpen={profilesDrawerOpen}
        onClose={() => setProfilesDrawerOpen(false)}
        from="bottom"
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe flex justify-center transition-transform duration-300 ${
          isOverlayOpen && !isOpen ? 'translate-y-28 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className={`w-full max-w-md md:max-w-3xl flex ${isAnchorRight ? 'justify-end pr-4' : 'justify-start pl-4'}`}>
          
          {/* =================================================================== */}
          {/* CONTENITORE UNICO MORPHING AD ALTEZZA DINAMICA CON FISICA A MOLLA  */}
          {/* =================================================================== */}
          <div
            ref={containerRef}
            style={{
              transformOrigin: isAnchorRight ? 'bottom right' : 'bottom left',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              height: `${dynamicHeight}px`,
              width: isOpen ? '304px' : '136px',
              borderRadius: isOpen ? '26px' : '34px',
            }}
            className={`relative mb-6 overflow-hidden pointer-events-auto transform-gpu select-none shadow-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 ${
              isReducedMotion ? 'transition-none' : 'transition-spring-morph'
            } ${
              isOpen ? 'p-2.5 flex flex-col' : 'p-1.5 flex items-center justify-center'
            }`}
          >
            {/* ── STATO COMPATTO (PILLOLA): VISIBILE SOLO SE MODE === 'IDLE' ── */}
            <div
              className={`flex items-center gap-2 ${
                isReducedMotion ? '' : 'transition-opacity duration-150'
              } ${
                isOpen ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'
              }`}
            >
              {/* Bottoni CIRCOLARI ordinati a seconda del lato preferito */}
              {isAnchorRight ? (
                <>
                  {/* Tasto Secondario (...) - Circolare */}
                  <button
                    onClick={handleToggleContextMenu}
                    className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Opzioni e Profilo"
                  >
                    <MoreHorizontal size={20} />
                  </button>

                  {/* Tasto Primario (Toggle / Morph Long Press) - Circolare */}
                  <button
                    ref={mainBtnRef}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={closeMenu}
                    className="w-13 h-13 rounded-full text-white flex items-center justify-center shadow-lg bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all select-none touch-none cursor-pointer"
                    aria-label={`Navigazione rapida a ${nextTargetItem.label} (Tieni premuto per il menu completo)`}
                  >
                    {nextTargetItem.icon}
                  </button>
                </>
              ) : (
                <>
                  {/* Tasto Primario per mancini - Circolare */}
                  <button
                    ref={mainBtnRef}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={closeMenu}
                    className="w-13 h-13 rounded-full text-white flex items-center justify-center shadow-lg bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all select-none touch-none cursor-pointer"
                    aria-label={`Navigazione rapida a ${nextTargetItem.label} (Tieni premuto per il menu completo)`}
                  >
                    {nextTargetItem.icon}
                  </button>

                  {/* Tasto Secondario (...) - Circolare */}
                  <button
                    onClick={handleToggleContextMenu}
                    className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Opzioni e Profilo"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </>
              )}
            </div>

            {/* ── STATO ESPANSO (PANNELLO MORFATO): VISIBILE SE MODE !== 'IDLE' ── */}
            {isOpen && (
              <div className="w-full min-w-[280px] flex flex-col flex-1 overflow-hidden transition-opacity duration-200">
                
                {/* 1. Header con titolo, back o close button */}
                <div
                  ref={headerRef}
                  className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-gray-100 dark:border-gray-800 shrink-0"
                >
                  {mode === 'nav' && drillCategory !== null ? (
                    <button
                      onClick={() => setDrillCategory(null)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-600 active:scale-95 transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} /> {drillCategory.label}
                    </button>
                  ) : mode === 'nav' ? (
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Navigazione
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={13} className="text-purple-500" /> {t('nav.profile')} & Opzioni
                    </span>
                  )}

                  <button
                    onClick={closeMenu}
                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Chiudi menu"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* 2. Corpo del Menu di Navigazione (con GPU Directional Slide-Fade fluido) */}
                {mode === 'nav' && (
                  <div className="relative overflow-hidden w-full flex-1">
                    {/* Pane 1: Root Menu */}
                    <div
                      ref={rootPaneRef}
                      className={`w-full p-1 space-y-0.5 transform-gpu ${
                        isReducedMotion ? '' : 'transition-all duration-200 ease-out'
                      } ${
                        drillCategory !== null
                          ? 'opacity-0 -translate-x-4 pointer-events-none absolute inset-0'
                          : 'opacity-100 translate-x-0 relative'
                      }`}
                    >
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
                                closeMenu();
                                triggerHaptic(20);
                              }
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer ${
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
                    <div
                      ref={subPaneRef}
                      className={`w-full p-1 space-y-0.5 transform-gpu ${
                        isReducedMotion ? '' : 'transition-all duration-200 ease-out'
                      } ${
                        drillCategory !== null
                          ? 'opacity-100 translate-x-0 relative'
                          : 'opacity-0 translate-x-4 pointer-events-none absolute inset-0'
                      }`}
                    >
                      {(drillCategory?.children ?? []).map(item => {
                        const isSelected = item.id === activePage;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onNavigate(item.id);
                              closeMenu();
                              triggerHaptic(20);
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer ${
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
                )}

                {/* 3. Corpo del Menu Contestuale (...) */}
                {mode === 'context' && (
                  <div ref={contextPaneRef} className="flex flex-col flex-1 space-y-2 p-1">
                    {/* Profilo Switcher Card */}
                    <div className="p-2 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Profilo Attivo
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setProfilesDrawerOpen(true);
                          closeMenu();
                        }}
                        className="w-full flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left cursor-pointer"
                      >
                        <span className="font-bold text-xs text-gray-800 dark:text-gray-100 truncate">
                          {activeProfileName}
                        </span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono px-1.5 py-0.5 rounded-full">
                          ID: {activeProfileId.slice(0, 4)}
                        </span>
                      </button>
                    </div>

                    {/* Azioni Contestuali */}
                    <div className="space-y-0.5">
                      <p className="px-2 pt-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t('benches.actions')}
                      </p>
                      {contextActions.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-gray-400 italic">{t('common.none')}</p>
                      ) : (
                        contextActions.map((action, i) => (
                          <div key={i}>
                            {action.dividerBefore && <div className="mx-2 my-1 h-px bg-gray-100 dark:bg-gray-800" />}
                            <button
                              onClick={() => {
                                action.onClick();
                                closeMenu();
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
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

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};
