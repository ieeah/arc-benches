import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check, Unlink, RefreshCw } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { useTranslation, getItemName, getItemSearchFields } from '@/i18n';
import { getRarityText } from '@/lib/rarity';
import { cn } from '@/lib/cn';

type BlueprintComboboxProps = {
  value?: string;
  onChange: (blueprintId?: string) => void;
  blueprints: ItemInfo[];
};

export function BlueprintCombobox({ value, onChange, blueprints }: BlueprintComboboxProps) {
  const { language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(() => {
    if (!value) return undefined;
    return blueprints.find((b) => b.id === value);
  }, [value, blueprints]);

  // Filtra i blueprint in tempo reale per tutte le traduzioni e campi di ricerca dinamici
  const filteredBlueprints = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blueprints.slice(0, 30);
    return blueprints
      .filter((bp) => {
        const fields = getItemSearchFields(bp);
        return fields.some((field) => field.toLowerCase().includes(q));
      })
      .slice(0, 30);
  }, [blueprints, query]);

  // Chiudi dropdown al click esterno
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus automatico sull'input alla comparsa
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSelect = (bpId?: string) => {
    onChange(bpId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Vista elemento collegato */}
      {selectedItem && !isOpen ? (
        <div className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <ItemCardFrameV2
              icon={selectedItem.icon || 'icons/default.webp'}
              alt={selectedItem.name}
              rarity={selectedItem.rarity || 'Common'}
              className="w-10 h-10 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold truncate">
                  {getItemName(selectedItem, language)}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase',
                    getRarityText(selectedItem.rarity || 'Common'),
                  )}
                >
                  · {selectedItem.rarity || 'Common'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                {selectedItem.name !== getItemName(selectedItem, language) && (
                  <span className="truncate">{selectedItem.name}</span>
                )}
                <code className="bg-gray-200/80 dark:bg-gray-700 px-1 py-0.2 rounded font-mono text-[9px]">
                  #{selectedItem.id}
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setQuery('');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Cambia blueprint collegato"
            >
              <RefreshCw size={12} />
              Cambia
            </button>
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Scollega blueprint"
            >
              <Unlink size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Input di ricerca / Combobox */
        <div className="space-y-1">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder="Cerca blueprint per nome o ID (#anvil-recipe)..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title="Cancella ricerca"
              >
                <X size={14} />
              </button>
            ) : selectedItem && isOpen ? (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title="Annulla"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Dropdown Opzioni */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden max-h-64 flex flex-col">
              {/* Opzione Svuotamento / Nessun Blueprint */}
              <button
                type="button"
                onClick={() => handleSelect(undefined)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-xs font-bold border-b border-gray-100 dark:border-gray-800 transition-colors text-left cursor-pointer shrink-0',
                  !value
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60',
                )}
              >
                <span>(Nessun blueprint collegato)</span>
                {!value && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
              </button>

              {/* Lista Blueprint Filtrati */}
              <div className="overflow-y-auto flex-1 divide-y divide-gray-100/60 dark:divide-gray-800/60">
                {filteredBlueprints.length > 0 ? (
                  filteredBlueprints.map((bp) => {
                    const isCurrent = bp.id === value;
                    const localizedName = getItemName(bp, language);
                    return (
                      <div
                        key={bp.id}
                        onClick={() => handleSelect(bp.id)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors text-left',
                          isCurrent
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                        )}
                      >
                        <ItemCardFrameV2
                          icon={bp.icon || 'icons/default.webp'}
                          alt={bp.name}
                          rarity={bp.rarity || 'Common'}
                          className="w-8 h-8 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate">
                              {localizedName}
                            </span>
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase',
                                getRarityText(bp.rarity || 'Common'),
                              )}
                            >
                              · {bp.rarity || 'Common'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                            {localizedName !== bp.name && (
                              <span className="truncate font-sans">{bp.name} ·</span>
                            )}
                            <span className="truncate">#{bp.id}</span>
                          </div>
                        </div>
                        {isCurrent && (
                          <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    Nessun blueprint trovato per «{query}»
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
