import { Search, ArrowUpDown, LayoutGrid } from 'lucide-react';
import type { FilterCategory, SortOption } from '../hooks/useListManager';

interface ListControlsProps<T> {
  query: string;
  setQuery: (q: string) => void;
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;
  activeSortId: string;
  setActiveSortId: (id: string) => void;
  groupByEnabled: boolean;
  setGroupByEnabled: (val: boolean) => void;

  searchPlaceholder?: string;
  categories?: FilterCategory<T>[];
  sortOptions?: SortOption<T>[];
  showGroupingToggle?: boolean;
  showSearch?: boolean;
  
  // Custom styling hooks
  searchRef?: React.RefObject<HTMLInputElement | null>;
}

export const ListControls = <T,>({
  query,
  setQuery,
  activeCategoryId,
  setActiveCategoryId,
  activeSortId,
  setActiveSortId,
  groupByEnabled,
  setGroupByEnabled,
  searchPlaceholder = 'Cerca...',
  categories = [],
  sortOptions = [],
  showGroupingToggle = false,
  showSearch = true,
  searchRef,
}: ListControlsProps<T>) => {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      {showSearch && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      )}

      {/* Categories Horizontal Scroll */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none overscroll-contain">
          {categories.map(cat => {
            const isSelected = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Sorting & Grouping Controls Row */}
      {(sortOptions.length > 0 || showGroupingToggle) && (
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {/* Sorting Selector */}
          {sortOptions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-1 min-w-0">
              <ArrowUpDown size={13} className="shrink-0 text-gray-400" />
              <div className="relative flex-1 min-w-0">
                <select
                  value={activeSortId}
                  onChange={e => setActiveSortId(e.target.value)}
                  className="w-full bg-transparent border-0 py-1 pl-0 pr-6 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-0 truncate cursor-pointer"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.id} value={opt.id} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Grouping Toggle */}
          {showGroupingToggle && (
            <button
              onClick={() => setGroupByEnabled(!groupByEnabled)}
              title={groupByEnabled ? 'Disattiva raggruppamento per tipo' : 'Raggruppa per tipo'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                groupByEnabled
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Gruppi</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
