import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '../store';
import {
  getAllListsPure,
  getOrderedListsPure,
  getRefinerLevelPure,
  getTotalRequiredMaterialsPure,
  getMissingMaterialsPure,
} from '../store/selectors';
import { REFINER_ID } from '../store/gameData';
import { safeLS } from '../lib/safeStorage';
import { rarityOrder } from '../lib/rarity';
import { SectionHeader } from '../components/SectionHeader';
import { InventoryCard } from '../components/InventoryCard';
import { useListManager } from '../hooks/useListManager';
import type { FilterCategory, SortOption } from '../hooks/useListManager';
import { ListControls } from '../components/ListControls';

interface StashMaterial {
  itemId: string;
  owned: number;
  required: number;
  missing: number;
  isCompleted: boolean;
}

export const StashPage = () => {
  // Selettori mirati — re-render solo quando la slice pertinente cambia
  const inventory = useAppStore(s => s.inventory);
  const hideoutLevels = useAppStore(s => s.hideoutLevels);
  const targetLevels = useAppStore(s => s.targetLevels);
  const activeModules = useAppStore(s => s.activeModules);
  const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
  const itemsInfo = useAppStore(s => s.itemsInfo);

  // Liste — cambiano raramente, mai su tap +/-
  const { workbenches, customLists, sharedCustomLists, listOrder } = useAppStore(
    useShallow(s => ({
      workbenches: s.workbenches,
      customLists: s.customLists,
      sharedCustomLists: s.sharedCustomLists,
      listOrder: s.listOrder,
    })),
  );

  // Action refs — reference-stabili in Zustand, non causano re-render
  const incrementItem = useAppStore(s => s.incrementItem);
  const decrementItem = useAppStore(s => s.decrementItem);
  const setItemCount = useAppStore(s => s.setItemCount);

  const allLists = useMemo(
    () => getAllListsPure(workbenches, sharedCustomLists, customLists),
    [workbenches, sharedCustomLists, customLists],
  );

  const orderedLists = useMemo(
    () => getOrderedListsPure(allLists, listOrder),
    [allLists, listOrder],
  );

  const totalRequired = useMemo(
    () => getTotalRequiredMaterialsPure(allLists, activeModules, hideoutLevels, targetLevels),
    [allLists, activeModules, hideoutLevels, targetLevels],
  );

  const missingMaterials = useMemo(
    () => getMissingMaterialsPure(totalRequired, inventory),
    [totalRequired, inventory],
  );

  const refinerLevel = useMemo(
    () => getRefinerLevelPure(hideoutLevels, REFINER_ID),
    [hideoutLevels],
  );

  // Map pre-calcolata per priority sort: O(n) invece di O(n²) nel comparatore
  const priorityMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedLists.forEach((list, i) => {
      if (!activeModules[list.id]) return;
      const current = hideoutLevels[list.id] ?? 0;
      const selected = targetLevels[list.id] ?? [];
      list.levels.forEach(lvl => {
        if (lvl.level > current && selected.includes(lvl.level)) {
          lvl.requirementItemIds.forEach(req => {
            if (!map.has(req.itemId)) map.set(req.itemId, i);
          });
        }
      });
    });
    return map;
  }, [orderedLists, activeModules, hideoutLevels, targetLevels]);

  // Filtriamo i materiali visibili in base alla spunta globale "nascondi completati"
  const stashItems = useMemo(() => {
    return filterHideCompleted
      ? missingMaterials.filter(m => !m.isCompleted)
      : missingMaterials;
  }, [missingMaterials, filterHideCompleted]);

  // Configurazione dei Filtri e degli Ordinamenti per il Stash
  const filterCategories = useMemo<FilterCategory<StashMaterial>[]>(() => [
    { id: 'all', label: 'Tutti', predicate: () => true },
    { id: 'materials', label: 'Materiali', predicate: m => ['basic material', 'topside material', 'refined material', 'advanced material', 'material', 'recyclable'].includes((itemsInfo[m.itemId]?.item_type || '').toLowerCase()) },
    { id: 'equipment', label: 'Armi & Equip', predicate: m => ['weapon', 'throwable', 'gadget', 'modification', 'augment', 'shield', 'deployable'].includes((itemsInfo[m.itemId]?.item_type || '').toLowerCase()) },
    { id: 'consumables', label: 'Consumabili', predicate: m => ['consumable', 'quick use', 'ammunition'].includes((itemsInfo[m.itemId]?.item_type || '').toLowerCase()) },
    { id: 'blueprints', label: 'Blueprint', predicate: m => (itemsInfo[m.itemId]?.item_type || '').toLowerCase() === 'blueprint' },
    { id: 'other', label: 'Altro', predicate: m => !['basic material', 'topside material', 'refined material', 'advanced material', 'material', 'recyclable', 'weapon', 'throwable', 'gadget', 'modification', 'augment', 'shield', 'deployable', 'consumable', 'quick use', 'ammunition', 'blueprint'].includes((itemsInfo[m.itemId]?.item_type || '').toLowerCase()) },
  ], [itemsInfo]);

  const sortOptions = useMemo<SortOption<StashMaterial>[]>(() => [
    {
      id: 'priority_asc',
      label: 'Priorità',
      compare: (a, b) => (priorityMap.get(a.itemId) ?? 999) - (priorityMap.get(b.itemId) ?? 999) || (itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(itemsInfo[b.itemId]?.name ?? b.itemId),
      toggleId: 'priority_desc',
    },
    {
      id: 'priority_desc',
      label: 'Priorità',
      compare: (a, b) => (priorityMap.get(b.itemId) ?? 999) - (priorityMap.get(a.itemId) ?? 999) || (itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(itemsInfo[b.itemId]?.name ?? b.itemId),
      toggleId: 'priority_asc',
      hideFromUi: true,
    },
    {
      id: 'name_asc',
      label: 'A-Z',
      compare: (a, b) => (itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(itemsInfo[b.itemId]?.name ?? b.itemId),
      toggleId: 'name_desc',
    },
    {
      id: 'name_desc',
      label: 'Z-A',
      compare: (a, b) => (itemsInfo[b.itemId]?.name ?? b.itemId).localeCompare(itemsInfo[a.itemId]?.name ?? a.itemId),
      toggleId: 'name_asc',
      hideFromUi: true,
    },
    {
      id: 'rarity_desc',
      label: 'Rarità',
      compare: (a, b) => (rarityOrder[itemsInfo[b.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1) - (rarityOrder[itemsInfo[a.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1) || (itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(itemsInfo[b.itemId]?.name ?? b.itemId),
      toggleId: 'rarity_asc',
    },
    {
      id: 'rarity_asc',
      label: 'Rarità',
      compare: (a, b) => (rarityOrder[itemsInfo[a.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1) - (rarityOrder[itemsInfo[b.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1) || (itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(itemsInfo[b.itemId]?.name ?? b.itemId),
      toggleId: 'rarity_desc',
      hideFromUi: true,
    },
    {
      id: 'type_asc',
      label: 'Tipo',
      compare: (a, b) => (itemsInfo[a.itemId]?.item_type ?? '').localeCompare(itemsInfo[b.itemId]?.item_type ?? '') || (itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(itemsInfo[b.itemId]?.name ?? b.itemId),
      toggleId: 'type_desc',
    },
    {
      id: 'type_desc',
      label: 'Tipo',
      compare: (a, b) => (itemsInfo[b.itemId]?.item_type ?? '').localeCompare(itemsInfo[a.itemId]?.item_type ?? '') || (itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(itemsInfo[b.itemId]?.name ?? b.itemId),
      toggleId: 'type_asc',
      hideFromUi: true,
    },
  ], [itemsInfo, priorityMap]);

  const initialSortId = useMemo(() => {
    return safeLS(() => {
      const raw = localStorage.getItem('stash-sort-v2');
      if (raw) {
        return JSON.parse(raw);
      }
      return 'priority_asc';
    }, 'priority_asc');
  }, []);

  const {
    query,
    setQuery,
    activeCategoryId,
    setActiveCategoryId,
    activeSortId,
    setActiveSortId,
    processedItems,
  } = useListManager<StashMaterial>({
    items: stashItems,
    search: {
      fields: m => [itemsInfo[m.itemId]?.name || m.itemId, m.itemId],
    },
    filters: {
      categories: filterCategories,
      defaultCategoryId: 'all',
    },
    sorting: {
      options: sortOptions,
      defaultSortId: initialSortId,
    },
  });

  // Persistenza ordinamento scelto dallo stash
  useEffect(() => {
    safeLS(() => localStorage.setItem('stash-sort-v2', JSON.stringify(activeSortId)), undefined);
  }, [activeSortId]);

  return (
    <div className="pb-28">
      <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="mb-3">
          <SectionHeader title="Stash" />
        </div>
        <ListControls
          query={query}
          setQuery={setQuery}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          activeSortId={activeSortId}
          setActiveSortId={setActiveSortId}
          groupByEnabled={false} // Raggruppamento disabilitato per lo stash
          setGroupByEnabled={() => {}}
          searchPlaceholder="Cerca nello stash…"
          categories={filterCategories}
          sortOptions={sortOptions}
          sortType="pills" // Utilizza le pillole per l'ordinamento
          items={stashItems} // Passiamo stashItems per calcolare il conteggio ed disabilitare i filtri vuoti
        />
      </div>

      <div className="p-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {processedItems.map(mat => (
          <InventoryCard key={mat.itemId} {...mat}
            itemInfo={itemsInfo[mat.itemId]}
            refinerLevel={refinerLevel}
            onIncrement={() => incrementItem(mat.itemId)}
            onDecrement={() => decrementItem(mat.itemId)}
            onSet={val => setItemCount(mat.itemId, val)}
          />
        ))}
      </div>

      {processedItems.length === 0 && (
        <div className="p-20 text-center text-gray-500 italic text-sm">
          Nessun materiale trovato.
        </div>
      )}
    </div>
  );
};
