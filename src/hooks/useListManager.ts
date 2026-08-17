import { useState, useMemo } from 'react';

export interface FilterCategory<T> {
  id: string;
  label: string;
  predicate: (item: T) => boolean;
}

export interface SortOption<T> {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface ListManagerConfig<T> {
  items: T[];
  search?: {
    fields: (item: T) => string[];
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
  const [activeCategoryId, setActiveCategoryId] = useState(
    filters?.defaultCategoryId || (filters?.categories[0]?.id ?? '')
  );
  const [activeSortId, setActiveSortId] = useState(
    sorting?.defaultSortId || (sorting?.options[0]?.id ?? '')
  );
  const [groupByEnabled, setGroupByEnabled] = useState(
    grouping?.defaultEnabled ?? false
  );

  // Filter & Sort
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Text Search Filter
    const q = query.toLowerCase().trim();
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
  }, [items, query, search, filters, activeCategoryId, sorting, activeSortId]);

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
    query,
    setQuery,
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
