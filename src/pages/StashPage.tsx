import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, LayoutGrid, List as ListIcon, ListChecks } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '@/store';
import {
  getAllListsPure,
  getOrderedListsPure,
  getRefinerLevelPure,
  getTotalRequiredMaterialsPure,
  getMissingMaterialsPure,
  getStashActionsPure,
  getItemDependenciesPure,
  getActiveExpeditionPure,
  getExpeditionCompletedPhasePure,
} from '@/store/selectors';
import { REFINER_ID } from '@/store/gameData';
import { safeLS } from '@/lib/safeStorage';
import { v } from '@/lib/validate';
import { rarityOrder } from '@/lib/rarity';
import { cn } from '@/lib/cn';
import { SectionHeader } from '@/components/SectionHeader';
import { InventoryCard } from '@/components/InventoryCard';
import { InventoryListItem } from '@/components/InventoryListItem';
import { StashItemDetailSheet } from '@/components/StashItemDetailSheet';
import { ActionSlider } from '@/components/ActionSlider';
import type { ItemInfo } from '@/types';

import { useListManager } from '@/hooks/useListManager';
import type { FilterCategory, SortOption } from '@/hooks/useListManager';
import { ListControls } from '@/components/ListControls';
import { useTranslation, getItemName, getItemSearchFields, getActionLabel, getListName } from '@/i18n';

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

export const StashPage = ({
  onOpenOverrides,
}: {
  onOpenOverrides?: (itemId: string) => void;
} = {}) => {
  const { t, language } = useTranslation();
  // Selettori mirati — re-render solo quando la slice pertinente cambia
  const inventory = useAppStore(s => s.inventory);
  const hideoutLevels = useAppStore(s => s.hideoutLevels);
  const targetLevels = useAppStore(s => s.targetLevels);
  const activeModules = useAppStore(s => s.activeModules);
  const checkedActions = useAppStore(s => s.checkedActions);
  const filterHideCompleted = useAppStore(s => s.filterHideCompleted);
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const stashGridDensity = useAppStore(s => s.stashGridDensity);
  const stashViewMode = useAppStore(s => s.stashViewMode);
  const setStashViewMode = useAppStore(s => s.setStashViewMode);

  const [selectedItemForDetail, setSelectedItemForDetail] = useState<ItemInfo | null>(null);
  const [showActions, setShowActions] = useState(true);

  // Liste — cambiano raramente, mai su tap +/-
  const { workbenches, customLists, sharedCustomLists, listOrder, expeditions, completedExpeditionsCount } = useAppStore(
    useShallow(s => ({
      workbenches: s.workbenches,
      customLists: s.customLists,
      sharedCustomLists: s.sharedCustomLists,
      listOrder: s.listOrder,
      expeditions: s.expeditions,
      completedExpeditionsCount: s.completedExpeditionsCount,
    })),
  );

  // Action refs — reference-stabili in Zustand, non causano re-render
  const incrementItem = useAppStore(s => s.incrementItem);
  const decrementItem = useAppStore(s => s.decrementItem);
  const setItemCount = useAppStore(s => s.setItemCount);
  const toggleAction = useAppStore(s => s.toggleAction);

  const activeExpedition = useMemo(
    () => getActiveExpeditionPure(expeditions, completedExpeditionsCount),
    [expeditions, completedExpeditionsCount],
  );

  const allLists = useMemo(
    () => getAllListsPure(workbenches, sharedCustomLists, customLists, activeExpedition),
    [workbenches, sharedCustomLists, customLists, activeExpedition],
  );

  const expeditionPhase = useMemo(
    () => getExpeditionCompletedPhasePure(activeExpedition, inventory, checkedActions),
    [activeExpedition, inventory, checkedActions],
  );

  const effectiveHideoutLevels = useMemo(() => {
    if (!activeExpedition) return hideoutLevels;
    return { ...hideoutLevels, [activeExpedition.id]: expeditionPhase };
  }, [hideoutLevels, activeExpedition, expeditionPhase]);

  const orderedLists = useMemo(
    () => getOrderedListsPure(allLists, listOrder),
    [allLists, listOrder],
  );

  const totalRequired = useMemo(
    () => getTotalRequiredMaterialsPure(
      allLists,
      activeModules,
      effectiveHideoutLevels,
      targetLevels,
      undefined,
      Date.now(),
      checkedActions,
    ),
    [allLists, activeModules, effectiveHideoutLevels, targetLevels, checkedActions],
  );

  const missingMaterials = useMemo(
    () => getMissingMaterialsPure(totalRequired, inventory),
    [totalRequired, inventory],
  );

  const allStashActions = useMemo(
    () => getStashActionsPure(allLists, activeModules, effectiveHideoutLevels, targetLevels, checkedActions),
    [allLists, activeModules, effectiveHideoutLevels, targetLevels, checkedActions],
  );

  const refinerLevel = useMemo(
    () => getRefinerLevelPure(effectiveHideoutLevels, REFINER_ID),
    [effectiveHideoutLevels],
  );

  // Mappa delle dipendenze per ciascun materiale
  const dependenciesMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getItemDependenciesPure>>();
    for (const mat of missingMaterials) {
      map.set(
        mat.itemId,
        getItemDependenciesPure(mat.itemId, allLists, activeModules, effectiveHideoutLevels, targetLevels, Date.now(), checkedActions),
      );
    }
    return map;
  }, [missingMaterials, allLists, activeModules, effectiveHideoutLevels, targetLevels, checkedActions]);

  // Map pre-calcolata per priority sort: O(n) invece di O(n²) nel comparatore
  const priorityMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedLists.forEach((list, i) => {
      if (activeModules[list.id] === false) return;
      const current = effectiveHideoutLevels[list.id] ?? 0;
      const selected = targetLevels[list.id] ?? list.levels.map(l => l.level);
      list.levels.forEach(lvl => {
        if (lvl.level > current && selected.includes(lvl.level)) {
          lvl.requirementItemIds.forEach(req => {
            if (!map.has(req.itemId)) map.set(req.itemId, i);
          });
        }
      });
    });
    return map;
  }, [orderedLists, activeModules, effectiveHideoutLevels, targetLevels]);

  // Categorie di filtro statiche
  const filterCategories = useMemo<FilterCategory<StashMaterial>[]>(() => [
    {
      id: 'all',
      label: t('stash.filterAll'),
      predicate: item => (filterHideCompleted ? !item.isCompleted : true),
    },
    {
      id: 'missing',
      label: t('stash.filterMissing'),
      predicate: item => !item.isCompleted,
    },
    {
      id: 'craftable',
      label: t('stash.filterCraftable'),
      predicate: item => {
        const info = itemsInfo[item.itemId];
        const isRefiner = info?.workbench === 'Refiner';
        return filterHideCompleted ? isRefiner && !item.isCompleted : isRefiner;
      },
    },
    {
      id: 'completed',
      label: t('stash.filterCompleted'),
      predicate: item => item.isCompleted,
    },
  ], [itemsInfo, filterHideCompleted, t]);

  // Opzioni di ordinamento statiche con label fissa e indicatore di direzione
  const sortOptions = useMemo<SortOption<StashMaterial>[]>(() => [
    {
      id: 'priority_asc',
      label: t('stash.sortPriority'),
      direction: 'asc',
      toggleId: 'priority_desc',
      compare: (a, b) => (priorityMap.get(a.itemId) ?? 999) - (priorityMap.get(b.itemId) ?? 999),
    },
    {
      id: 'priority_desc',
      label: t('stash.sortPriority'),
      direction: 'desc',
      toggleId: 'priority_asc',
      hideFromUi: true,
      compare: (a, b) => (priorityMap.get(b.itemId) ?? 999) - (priorityMap.get(a.itemId) ?? 999),
    },
    {
      id: 'name_asc',
      label: t('stash.sortName'),
      direction: 'asc',
      indicatorType: 'text',
      indicatorText: 'A-Z',
      toggleId: 'name_desc',
      compare: (a, b) => {
        const nameA = getItemName(itemsInfo[a.itemId], language) || a.itemId;
        const nameB = getItemName(itemsInfo[b.itemId], language) || b.itemId;
        return nameA.localeCompare(nameB, language === 'en' ? 'en' : 'it', { sensitivity: 'base' });
      },
    },
    {
      id: 'name_desc',
      label: t('stash.sortName'),
      direction: 'desc',
      indicatorType: 'text',
      indicatorText: 'Z-A',
      toggleId: 'name_asc',
      hideFromUi: true,
      compare: (a, b) => {
        const nameA = getItemName(itemsInfo[a.itemId], language) || a.itemId;
        const nameB = getItemName(itemsInfo[b.itemId], language) || b.itemId;
        return nameB.localeCompare(nameA, language === 'en' ? 'en' : 'it', { sensitivity: 'base' });
      },
    },
    {
      id: 'rarity_desc',
      label: t('stash.sortRarity'),
      direction: 'desc',
      toggleId: 'rarity_asc',
      compare: (a, b) => {
        const rA = rarityOrder[itemsInfo[a.itemId]?.rarity?.toLowerCase() ?? ''] ?? 0;
        const rB = rarityOrder[itemsInfo[b.itemId]?.rarity?.toLowerCase() ?? ''] ?? 0;
        return rB - rA;
      },
    },
    {
      id: 'rarity_asc',
      label: t('stash.sortRarity'),
      direction: 'asc',
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
      label: t('stash.sortType'),
      direction: 'asc',
      toggleId: 'type_desc',
      compare: (a, b) => {
        const tA = itemsInfo[a.itemId]?.item_type ?? '';
        const tB = itemsInfo[b.itemId]?.item_type ?? '';
        return tA.localeCompare(tB);
      },
    },
    {
      id: 'type_desc',
      label: t('stash.sortType'),
      direction: 'desc',
      toggleId: 'type_asc',
      hideFromUi: true,
      compare: (a, b) => {
        const tA = itemsInfo[a.itemId]?.item_type ?? '';
        const tB = itemsInfo[b.itemId]?.item_type ?? '';
        return tB.localeCompare(tA);
      },
    },
  ], [itemsInfo, priorityMap, language, t]);

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
    items: missingMaterials,
    search: {
      fields: m => itemsInfo[m.itemId] ? getItemSearchFields(itemsInfo[m.itemId]) : [m.itemId],
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

  // Cliccando su una categoria impostiamo activeCategoryId senza mutare il toggle globale
  const handleCategorySelect = (catId: string) => {
    setActiveCategoryId(catId);
  };

  const visibleActions = useMemo(() => {
    if (activeCategoryId === 'craftable') {
      return [];
    }
    if (activeCategoryId === 'missing') {
      return allStashActions.filter(a => !a.isCompleted);
    }
    if (activeCategoryId === 'completed') {
      return allStashActions.filter(a => a.isCompleted);
    }
    // activeCategoryId === 'all'
    if (filterHideCompleted) {
      return allStashActions.filter(a => !a.isCompleted);
    }
    return allStashActions;
  }, [allStashActions, activeCategoryId, filterHideCompleted]);

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
                  onClick={() => setStashViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    stashViewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                  title={t('stash.viewGrid')}
                  aria-label={t('stash.viewGrid')}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setStashViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    stashViewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                  title={t('stash.viewList')}
                  aria-label={t('stash.viewList')}
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
          setActiveCategoryId={handleCategorySelect}
          activeSortId={activeSortId}
          setActiveSortId={setActiveSortId}
          groupByEnabled={false}
          setGroupByEnabled={() => {}}
          searchPlaceholder={t('stash.searchPlaceholder')}
          categories={filterCategories}
          sortOptions={sortOptions}
          sortType="pills" // Utilizza le pillole per l'ordinamento
          items={missingMaterials} // Calcola i badge sul totale reale dei materiali tracciati
        />
      </div>

      {visibleActions.length > 0 && (
        <div className="mx-3 mt-3 mb-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2.5">
          <button
            onClick={() => setShowActions(prev => !prev)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-amber-500 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                {t('stash.actions')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                {visibleActions.length}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={cn('text-gray-400 transition-transform duration-200', showActions ? 'rotate-180' : '')}
            />
          </button>

          {showActions && (
            <div className="space-y-2 pt-1">
              {visibleActions.map(action => (
                <ActionSlider
                  key={`${action.listId}|${action.level}|${action.actionId}`}
                  label={getActionLabel(action.action, language) || action.label}
                  listName={getListName(action.list, language) || action.listName}
                  level={action.level}
                  isCompleted={action.isCompleted}
                  onComplete={() => toggleAction(action.listId, action.level, action.actionId)}
                  onToggle={() => toggleAction(action.listId, action.level, action.actionId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {stashViewMode === 'grid' ? (

        <div
          data-list-container
          className={`p-2 grid gap-2.5 ${
            stashGridDensity === 'compact' ? 'grid-stash-compact' : 'grid-stash-comfortable'
          }`}
        >
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

      {processedItems.length === 0 && visibleActions.length === 0 && (
        <div className="p-20 text-center text-gray-500 italic text-sm">
          {t('stash.noMaterialsFound')}
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
          onOpenOverrides={onOpenOverrides}
        />
      )}
    </div>
  );
};
