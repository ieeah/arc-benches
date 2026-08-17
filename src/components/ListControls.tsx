import { useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid } from 'lucide-react';
import type { FilterCategory, SortOption } from '../hooks/useListManager';
import { ScrollablePillList } from './ScrollablePillList';
import type { PillItem } from './ScrollablePillList';

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
  
  sortType?: 'select' | 'pills';
  items?: T[]; 
  
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
  sortType = 'select',
  items = [],
  searchRef,
}: ListControlsProps<T>) => {
  
  // Dynamic item counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!items || items.length === 0 || categories.length === 0) return counts;
    
    categories.forEach(cat => {
      counts[cat.id] = items.filter(cat.predicate).length;
    });
    return counts;
  }, [items, categories]);

  // Sort categories: "Tutti" first, then enabled categories, then disabled categories last
  const sortedCategories = useMemo(() => {
    if (categories.length === 0) return [];
    
    const allCat = categories.find(c => c.id === 'all');
    const otherCats = categories.filter(c => c.id !== 'all');
    
    const enabled = otherCats.filter(c => (categoryCounts[c.id] ?? 0) > 0);
    const disabled = otherCats.filter(c => (categoryCounts[c.id] ?? 0) === 0);
    
    return allCat ? [allCat, ...enabled, ...disabled] : [...enabled, ...disabled];
  }, [categories, categoryCounts]);

  // Map Filter Categories to PillItem format
  const categoryPills = useMemo<PillItem[]>(() => {
    return sortedCategories.map(cat => {
      const isSelected = activeCategoryId === cat.id;
      const count = categoryCounts[cat.id] ?? 0;
      const isDisabled = cat.id !== 'all' && count === 0;

      return {
        id: cat.id,
        label: cat.label,
        count: cat.id !== 'all' ? count : undefined,
        isSelected,
        isDisabled,
        onClick: () => setActiveCategoryId(cat.id),
      };
    });
  }, [sortedCategories, activeCategoryId, categoryCounts, setActiveCategoryId]);

  // Filter out options configured to be hidden from UI (e.g. desc counterparts)
  const visibleSortOptions = useMemo(() => {
    return sortOptions.filter(opt => !opt.hideFromUi);
  }, [sortOptions]);

  // Map SortOptions to PillItem format
  const sortPills = useMemo<PillItem[]>(() => {
    return visibleSortOptions.map(opt => {
      const isSelected = activeSortId === opt.id || !!(opt.toggleId && activeSortId === opt.toggleId);
      const counterpart = opt.toggleId ? sortOptions.find(o => o.id === opt.toggleId) : null;
      const currentLabel = (isSelected && activeSortId === opt.toggleId && counterpart)
        ? counterpart.label
        : opt.label;
      
      const hasSameLabel = counterpart && opt.label === counterpart.label;
      const showArrow = isSelected && opt.toggleId && hasSameLabel;
      const isReversed = activeSortId === opt.toggleId;

      const handleSortClick = () => {
        if (activeSortId === opt.id && opt.toggleId) {
          setActiveSortId(opt.toggleId);
        } else if (activeSortId === opt.toggleId && opt.id) {
          setActiveSortId(opt.id);
        } else {
          setActiveSortId(opt.id);
        }
      };

      return {
        id: opt.id,
        label: currentLabel,
        isSelected,
        onClick: handleSortClick,
        icon: showArrow ? (
          isReversed ? (
            <ArrowUp size={11} className="shrink-0 animate-fade-in text-white/90" />
          ) : (
            <ArrowDown size={11} className="shrink-0 animate-fade-in text-white/90" />
          )
        ) : undefined,
      };
    });
  }, [visibleSortOptions, activeSortId, sortOptions, setActiveSortId]);

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
      {categoryPills.length > 0 && (
        <ScrollablePillList items={categoryPills} bleedType="full" />
      )}

      {/* Sorting & Grouping Controls */}
      {sortType === 'pills' ? (
        /* Sorting as scrollable pills (e.g. StashPage layout) */
        sortPills.length > 0 && (
          <div className="flex items-center gap-2 pt-0.5">
            <ScrollablePillList items={sortPills} bleedType="left-only" />
            
            {/* Vertical divider + Grouping Toggle */}
            {showGroupingToggle && (
              <>
                <div className="shrink-0 w-px h-5 bg-gray-200 dark:bg-gray-700 self-center" />
                <button
                  onClick={() => setGroupByEnabled(!groupByEnabled)}
                  title={groupByEnabled ? 'Disattiva raggruppamento per tipo' : 'Raggruppa per tipo'}
                  className={`flex items-center gap-1 shrink-0 cursor-pointer transition-colors py-1.5 ${
                    groupByEnabled
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span className="text-xs font-semibold">Gruppi</span>
                </button>
              </>
            )}
          </div>
        )
      ) : (
        /* Sorting as Select Dropdown */
        (visibleSortOptions.length > 0 || showGroupingToggle) && (
          <div className="flex items-center justify-between gap-3 pt-0.5">
            {visibleSortOptions.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-1 min-w-0">
                <ArrowUpDown size={13} className="shrink-0 text-gray-400" />
                <div className="relative flex-1 min-w-0">
                  <select
                    value={activeSortId}
                    onChange={e => setActiveSortId(e.target.value)}
                    className="w-full bg-transparent border-0 py-1 pl-0 pr-6 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-0 truncate cursor-pointer"
                  >
                    {visibleSortOptions.map(opt => (
                      <option key={opt.id} value={opt.id} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {showGroupingToggle && (
              <button
                onClick={() => setGroupByEnabled(!groupByEnabled)}
                title={groupByEnabled ? 'Disattiva raggruppamento per tipo' : 'Raggruppa per tipo'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
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
        )
      )}
    </div>
  );
};
