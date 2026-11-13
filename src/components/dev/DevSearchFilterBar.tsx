import React from 'react';
import { Search, X, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

export type DevSearchFilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  count?: number;
  countLabel?: string;
  onClear?: () => void;
  onCreateNew?: () => void;
  createTitle?: string;
  filters?: React.ReactNode;
  className?: string;
};

export function DevSearchFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Cerca…',
  count,
  countLabel,
  onClear,
  onCreateNew,
  createTitle = 'Nuovo elemento',
  filters,
  className,
}: DevSearchFilterBarProps) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onSearchChange('');
    }
  };

  const hasSearch = searchQuery.length > 0;

  return (
    <div
      className={cn(
        'space-y-2 p-3 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50',
        className,
      )}
    >
      {/* Campo di ricerca e pulsante rapido di creazione */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {hasSearch && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Cancella testo di ricerca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            title={createTitle}
            className="p-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Plus size={15} />
          </button>
        )}
      </div>

      {/* Riga conteggio e filtri opzionali */}
      {(count !== undefined || filters) && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {count !== undefined ? (
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {count} {countLabel || (count === 1 ? 'risultato' : 'risultati')}
            </span>
          ) : (
            <div />
          )}

          {filters && <div className="flex flex-wrap items-center gap-1.5">{filters}</div>}
        </div>
      )}
    </div>
  );
}
