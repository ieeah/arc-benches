import { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '@/store';
import {
  getAllListsPure,
  getOrderedListsPure,
  getRefinerLevelPure,
  getTotalRequiredMaterialsPure,
  getMissingMaterialsPure,
  getItemDependenciesPure,
} from '@/store/selectors';
import { REFINER_ID } from '@/store/gameData';
import { safeLS } from '@/lib/safeStorage';
import { v } from '@/lib/validate';
import { rarityOrder } from '@/lib/rarity';
import { SectionHeader } from '@/components/SectionHeader';
import { InventoryCard } from '@/components/InventoryCard';
import { InventoryListItem } from '@/components/InventoryListItem';
import { StashItemDetailSheet } from '@/components/StashItemDetailSheet';
import type { ItemInfo } from '@/types';
import { useListManager } from '@/hooks/useListManager';
import type { FilterCategory, SortOption } from '@/hooks/useListManager';
import { ListControls } from '@/components/ListControls';

const STASH_SORT_IDS = [
  'priority_asc', 'priority_desc',
  'name_asc', 'name_desc',
  'rarity_desc', 'rarity_asc',
  'type_asc', 'type_desc',
] as const;
const StashSortIdSchema = v.oneOf(STASH_SORT_IDS);
type StashSortId = typeof STASH_SORT_IDS[number];

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

  // Modalità di visualizzazione: Griglia vs Lista (persistita con safeLS)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() =>
    safeLS(() => {
      const saved = localStorage.getItem('stash-view-mode');
      return saved === 'list' || saved === 'grid' ? saved : 'grid';
    }, 'grid')
  );

  useEffect(() => {
    safeLS(() => localStorage.setItem('stash-view-mode', viewMode), undefined);
  }, [viewMode]);

  const [selectedItemForDetail, setSelectedItemForDetail] = useState<ItemInfo | null>(null);

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

  // Mappa delle dipendenze per ciascun materiale
  const dependenciesMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getItemDependenciesPure>>();
    for (const mat of missingMaterials) {
      map.set(
        mat.itemId,
        getItemDependenciesPure(mat.itemId, allLists, activeModules, hideoutLevels, targetLevels),
      );
    }
    return map;
  }, [missingMaterials, allLists, activeModules, hideoutLevels, targetLevels]);

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

  // Filtra gli elementi completati se il toggle globale è attivo
  const stashItems = useMemo(() => {
    if (!filterHideCompleted) return missingMaterials;
    return missingMaterials.filter(m => !m.isCompleted);
  }, [missingMaterials, filterHideCompleted]);

  // Categorie di filtro statiche
  const filterCategories = useMemo<FilterCategory<StashMaterial>[]>(() => [
    { id: 'all', label: 'Tutti', predicate: () => true },
    {
      id: 'missing',
      label: 'Mancanti',
      predicate: item => !item.isCompleted,
    },
    {
      id: 'completed',
      label: 'Completati',
      predicate: item => item.isCompleted,
    },
    {
      id: 'craftable',
      label: 'Craftabili',
      predicate: item => {
        const info = itemsInfo[item.itemId];
        return info?.workbench === 'Refiner';
      },
    },
  ], [itemsInfo]);

  // Opzioni di ordinamento statiche
  const sortOptions = useMemo<SortOption<StashMaterial>[]>(() => [
    {
      id: 'priority_asc',
      label: 'Priorità',
      toggleId: 'priority_desc',
      compare: (a, b) => (priorityMap.get(a.itemId) ?? 999) - (priorityMap.get(b.itemId) ?? 999),
    },
    {
      id: 'priority_desc',
      label: 'Priorità (Inversa)',
      toggleId: 'priority_asc',
      hideFromUi: true,
      compare: (a, b) => (priorityMap.get(b.itemId) ?? 999) - (priorityMap.get(a.itemId) ?? 999),
    },
    {
      id: 'name_asc',
      label: 'Nome (A-Z)',
      toggleId: 'name_desc',
      compare: (a, b) => {
        const nameA = itemsInfo[a.itemId]?.name ?? a.itemId;
        const nameB = itemsInfo[b.itemId]?.name ?? b.itemId;
        return nameA.localeCompare(nameB);
      },
    },
    {
      id: 'name_desc',
      label: 'Nome (Z-A)',
      toggleId: 'name_asc',
      hideFromUi: true,
      compare: (a, b) => {
        const nameA = itemsInfo[a.itemId]?.name ?? a.itemId;
        const nameB = itemsInfo[b.itemId]?.name ?? b.itemId;
        return nameB.localeCompare(nameA);
      },
    },
    {
      id: 'rarity_desc',
      label: 'Rarità',
      toggleId: 'rarity_asc',
      compare: (a, b) => {
        const rA = rarityOrder[itemsInfo[a.itemId]?.rarity?.toLowerCase() ?? ''] ?? 0;
        const rB = rarityOrder[itemsInfo[b.itemId]?.rarity?.toLowerCase() ?? ''] ?? 0;
        return rB - rA;
      },
    },
    {
      id: 'rarity_asc',
      label: 'Rarità (Crescente)',
      toggleId: 'rarity_desc',
      hideFromUi: true,
      compare: (a, b) => {
        const rA = rarityOrder[itemsInfo[a.itemId]?.rarity?.toLowerCase() ?? ''] ?? 0;
        const rB = rarityOrder[itemsInfo[b.itemId]?.rarity?.toLowerCase() ?? ''] ?? 0;
        return rA - rB;
      },
    },
    {
      id: 'type_asc',
      label: 'Tipo',
      toggleId: 'type_desc',
      compare: (a, b) => {
        const tA = itemsInfo[a.itemId]?.item_type ?? '';
        const tB = itemsInfo[b.itemId]?.item_type ?? '';
        return tA.localeCompare(tB);
      },
    },
    {
      id: 'type_desc',
      label: 'Tipo (Inverso)',
      toggleId: 'type_asc',
      hideFromUi: true,
      compare: (a, b) => {
        const tA = itemsInfo[a.itemId]?.item_type ?? '';
        const tB = itemsInfo[b.itemId]?.item_type ?? '';
        return tB.localeCompare(tA);
      },
    },
  ], [itemsInfo, priorityMap]);

  // Inizializza l'ordinamento salvato solo al mount
  const initialSortId = useMemo<StashSortId>(() => {
    return safeLS(() => {
      const raw = localStorage.getItem('stash-sort-v2');
      if (raw) return StashSortIdSchema.parse(JSON.parse(raw), 'priority_asc');
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
          <SectionHeader
            title="Stash"
            actions={
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setViewMode('grid');
                    safeLS(() => localStorage.setItem('stash-view-mode', 'grid'), undefined);
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                  title="Vista Griglia"
                  aria-label="Vista Griglia"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => {
                    setViewMode('list');
                    safeLS(() => localStorage.setItem('stash-view-mode', 'list'), undefined);
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                  title="Vista Lista"
                  aria-label="Vista Lista"
                >
                  <ListIcon size={16} />
                </button>
              </div>
            }
          />
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

      {viewMode === 'grid' ? (
        <div data-list-container className="p-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {processedItems.map(mat => (
            <InventoryCard
              key={mat.itemId}
              {...mat}
              itemInfo={itemsInfo[mat.itemId]}
              refinerLevel={refinerLevel}
              onIncrement={() => incrementItem(mat.itemId)}
              onDecrement={() => decrementItem(mat.itemId)}
              onSet={val => setItemCount(mat.itemId, val)}
              onOpenDetail={() => {
                const info = itemsInfo[mat.itemId] ?? {
                  id: mat.itemId,
                  name: mat.itemId,
                  description: '',
                  icon: null,
                  rarity: 'Common',
                  item_type: 'Material',
                  subcategory: null,
                  value: 0,
                  workbench: null,
                  loot_area: null,
                  stack_size: null,
                };
                setSelectedItemForDetail(info);
              }}
            />
          ))}
        </div>
      ) : (
        <div data-list-container="compact" className="p-2 flex flex-col gap-2">
          {processedItems.map(mat => (
            <InventoryListItem
              key={mat.itemId}
              {...mat}
              itemInfo={itemsInfo[mat.itemId]}
              refinerLevel={refinerLevel}
              dependencies={dependenciesMap.get(mat.itemId) ?? []}
              onIncrement={() => incrementItem(mat.itemId)}
              onDecrement={() => decrementItem(mat.itemId)}
              onSet={val => setItemCount(mat.itemId, val)}
              onOpenDetail={() => {
                const info = itemsInfo[mat.itemId] ?? {
                  id: mat.itemId,
                  name: mat.itemId,
                  description: '',
                  icon: null,
                  rarity: 'Common',
                  item_type: 'Material',
                  subcategory: null,
                  value: 0,
                  workbench: null,
                  loot_area: null,
                  stack_size: null,
                };
                setSelectedItemForDetail(info);
              }}
            />
          ))}
        </div>
      )}

      {processedItems.length === 0 && (
        <div className="p-20 text-center text-gray-500 italic text-sm">
          Nessun materiale trovato.
        </div>
      )}

      {/* Modale con la vista completa di dettaglio del fabbisogno e ricerca oggetto */}
      {selectedItemForDetail && (
        <StashItemDetailSheet
          item={selectedItemForDetail}
          owned={inventory[selectedItemForDetail.id] ?? 0}
          required={totalRequired[selectedItemForDetail.id] ?? 0}
          refinerLevel={refinerLevel}
          dependencies={dependenciesMap.get(selectedItemForDetail.id) ?? []}
          onClose={() => setSelectedItemForDetail(null)}
        />
      )}
    </div>
  );
};
