import { useState, useMemo, useEffect } from 'react';

export interface FilterCategory<T> {
  id: string;
  label: string;
  predicate: (item: T) => boolean;
}

export type SortIndicatorType = 'arrow' | 'text';

export interface SortOption<T> {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
  toggleId?: string;
  hideFromUi?: boolean;
  direction?: 'asc' | 'desc';
  indicatorType?: SortIndicatorType;
  indicatorText?: string;
}

export interface ListManagerConfig<T> {
  items: T[];
  search?: {
    fields: (item: T) => string[];
    /** Debounce delay in ms for filtering (default 300). Set to 0 to disable. */
    debounceMs?: number;
  };
  filters?: {
    categories: FilterCategory<T>[];
    defaultCategoryId?: string;
  };
  sorting?: {
    options: SortOption<T>[];
    defaultSortId?: string;
  };
  grouping?: {
    groupKey: (item: T) => string;
    groupSort?: (a: string, b: string) => number;
    defaultEnabled?: boolean;
  };
}

export const useListManager = <T>({
  items,
  search,
  filters,
  sorting,
  grouping,
}: ListManagerConfig<T>) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(
    filters?.defaultCategoryId || (filters?.categories[0]?.id ?? '')
  );
  const [activeSortId, setActiveSortId] = useState(
    sorting?.defaultSortId || (sorting?.options[0]?.id ?? '')
  );
  const [groupByEnabled, setGroupByEnabled] = useState(
    grouping?.defaultEnabled ?? false
  );

  // Debounce the query used for filtering.
  // The raw `query` is always up-to-date for the input field.
  // `debouncedQuery` lags behind to avoid re-filtering on every keystroke.
  useEffect(() => {
    const delay = search?.debounceMs ?? 300;
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    return () => clearTimeout(timer);
  }, [query, search?.debounceMs]);

  // Filter & Sort (uses debouncedQuery to avoid intermediate flashes)
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Text Search Filter
    const q = debouncedQuery.toLowerCase().trim();
    if (q && search) {
      result = result.filter(item =>
        search.fields(item).some(field => field.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (filters && activeCategoryId) {
      const activeCat = filters.categories.find(c => c.id === activeCategoryId);
      if (activeCat) {
        result = result.filter(activeCat.predicate);
      }
    }

    // 3. Sorting
    if (sorting && activeSortId) {
      const activeSort = sorting.options.find(o => o.id === activeSortId);
      if (activeSort) {
        result.sort(activeSort.compare);
      }
    }

    return result;
  }, [items, debouncedQuery, search, filters, activeCategoryId, sorting, activeSortId]);

  // Grouping
  const { groupedItems, groupKeys } = useMemo(() => {
    if (!grouping || !groupByEnabled) {
      return { groupedItems: null, groupKeys: [] };
    }

    const groups: Record<string, T[]> = {};
    processedItems.forEach(item => {
      const key = grouping.groupKey(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    const keys = Object.keys(groups);
    if (grouping.groupSort) {
      keys.sort(grouping.groupSort);
    } else {
      keys.sort((a, b) => a.localeCompare(b));
    }

    return { groupedItems: groups, groupKeys: keys };
  }, [processedItems, grouping, groupByEnabled]);

  return {
    query,        // immediate — use for <input value={query}> and empty-state checks
    setQuery,
    debouncedQuery, // delayed — reflects the query currently applied to results
    activeCategoryId,
    setActiveCategoryId,
    activeSortId,
    setActiveSortId,
    groupByEnabled,
    setGroupByEnabled,

    processedItems,
    groupedItems,
    groupKeys,
  };
};
