import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Backpack, Check, Database, LayoutList, Moon, MoreHorizontal, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type NavMenuItem = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'danger';
  checked?: boolean;
  dividerBefore?: boolean;
};

export const FloatingNav = ({
  activePage,
  navSide,
  onNavigate,
  onOpenDatabase,
  pageMenuItems,
}: {
  activePage: 'stash' | 'liste';
  navSide: 'left' | 'right';
  onNavigate: (page: 'stash' | 'liste') => void;
  onOpenDatabase: () => void;
  pageMenuItems: NavMenuItem[];
}) => {
  const { dark: isDark, toggle: toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingDanger, setPendingDanger] = useState<NavMenuItem | null>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouse = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const destPage = activePage === 'stash' ? 'liste' : 'stash';
  const closeMenu = () => { setMenuOpen(false); setPendingDanger(null); };

  const universalItems: NavMenuItem[] = [
    {
      icon: <Database size={16} />,
      label: 'Database',
      onClick: () => { closeMenu(); onOpenDatabase(); },
    },
    {
      icon: isDark ? <Sun size={16} /> : <Moon size={16} />,
      label: isDark ? 'Tema Chiaro' : 'Tema Scuro',
      onClick: toggleTheme,
    },
  ];

  const primaryBtn = (
    <button
      onClick={() => { closeMenu(); onNavigate(destPage); }}
      className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all"
      aria-label={destPage === 'liste' ? 'Vai a Liste' : 'Vai a Stash'}
    >
      {destPage === 'liste' ? <LayoutList size={24} /> : <Backpack size={24} />}
    </button>
  );

  const secondaryBtn = (
    <button
      onClick={() => { setMenuOpen(m => !m); setPendingDanger(null); }}
      className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center active:scale-95 transition-all"
      aria-label="Menu"
    >
      <MoreHorizontal size={22} />
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pointer-events-none pb-safe">
      <div
        ref={pillRef}
        className="relative mb-6 flex items-center gap-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-full shadow-2xl border border-gray-200/70 dark:border-gray-800 p-2 pointer-events-auto"
      >
        {navSide === 'right' ? <>{secondaryBtn}{primaryBtn}</> : <>{primaryBtn}{secondaryBtn}</>}

        {menuOpen && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {pendingDanger ? (
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Verranno azzerati tutti i progressi (livelli, inventario, azioni). Le liste personalizzate rimangono.
                </p>
                <button
                  onClick={() => { pendingDanger.onClick(); closeMenu(); }}
                  className="w-full py-2.5 bg-red-500 text-white font-bold text-sm rounded-2xl active:scale-[0.98]"
                >
                  Conferma ripristino
                </button>
                <button
                  onClick={() => setPendingDanger(null)}
                  className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-2xl active:scale-[0.98]"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <>
                {pageMenuItems.map((item, i) => (
                  <div key={i}>
                    {item.dividerBefore && <div className="mx-3 h-px bg-gray-100 dark:bg-gray-800" />}
                    <button
                      onClick={() => {
                        if (item.variant === 'danger') { setPendingDanger(item); return; }
                        item.onClick();
                        closeMenu();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                        item.variant === 'danger'
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        item.variant === 'danger'
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.checked && <Check size={14} className="text-blue-500 shrink-0" />}
                    </button>
                  </div>
                ))}

                {pageMenuItems.length > 0 && <div className="mx-3 h-px bg-gray-100 dark:bg-gray-800" />}

                {universalItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
