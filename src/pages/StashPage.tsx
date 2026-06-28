import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
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

type SortKey = 'priority' | 'name' | 'rarity' | 'type';
type SortDir = 1 | -1;

const sortLabels: Record<SortKey, string> = {
  priority: 'Priorità', name: 'A→Z', rarity: 'Rarità', type: 'Tipo',
};

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

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>(() =>
    safeLS(() => {
      const raw = localStorage.getItem('stash-sort');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.key) return { key: parsed.key as SortKey, dir: (parsed.dir === -1 ? -1 : 1) as SortDir };
      }
      return { key: 'priority' as SortKey, dir: 1 as SortDir };
    }, { key: 'priority' as SortKey, dir: 1 as SortDir })
  );

  useEffect(() => {
    safeLS(() => localStorage.setItem('stash-sort', JSON.stringify(sort)), undefined);
  }, [sort]);

  const handleSortClick = (key: SortKey) =>
    setSort(s => s.key === key ? { key, dir: (s.dir * -1) as SortDir } : { key, dir: 1 });

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

  const sortedMaterials = useMemo(() => {
    return [...missingMaterials].sort((a, b) => {
      let cmp = 0;
      if (sort.key === 'priority') {
        cmp = (priorityMap.get(a.itemId) ?? 999) - (priorityMap.get(b.itemId) ?? 999);
      } else if (sort.key === 'name') {
        cmp = (itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(itemsInfo[b.itemId]?.name ?? b.itemId);
      } else if (sort.key === 'rarity') {
        const ra = rarityOrder[itemsInfo[a.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1;
        const rb = rarityOrder[itemsInfo[b.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1;
        cmp = rb - ra;
      } else if (sort.key === 'type') {
        cmp = (itemsInfo[a.itemId]?.item_type ?? '').localeCompare(itemsInfo[b.itemId]?.item_type ?? '');
      }
      return cmp * sort.dir;
    });
  }, [missingMaterials, sort, priorityMap, itemsInfo]);

  const visibleMaterials = filterHideCompleted
    ? sortedMaterials.filter(m => !m.isCompleted)
    : sortedMaterials;

  return (
    <div className="pb-28">
      <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="mb-3">
          <SectionHeader title="Stash" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {(Object.keys(sortLabels) as SortKey[]).map(key => {
            const isSelected = sort.key === key;
            return (
              <button key={key} onClick={() => handleSortClick(key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {sortLabels[key]}
                {isSelected && (sort.dir === 1 ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visibleMaterials.map(mat => (
          <InventoryCard key={mat.itemId} {...mat}
            itemInfo={itemsInfo[mat.itemId]}
            refinerLevel={refinerLevel}
            onIncrement={() => incrementItem(mat.itemId)}
            onDecrement={() => decrementItem(mat.itemId)}
            onSet={val => setItemCount(mat.itemId, val)}
          />
        ))}
      </div>
      {missingMaterials.length === 0 && (
        <div className="p-20 text-center text-gray-500 italic text-sm">
          Nessun materiale richiesto per gli obiettivi attuali.
        </div>
      )}
    </div>
  );
};
