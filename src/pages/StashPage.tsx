import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useAppStore } from '../store';
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
  const store = useAppStore();
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

  const missingMaterials = store.getMissingMaterials();
  const orderedLists = store.getOrderedLists();
  const refinerLevel = store.getRefinerLevel();

  // Priority sort: each item gets the index of the highest-priority list that needs it
  const itemPriorityIndex = (itemId: string): number => {
    for (let i = 0; i < orderedLists.length; i++) {
      const list = orderedLists[i];
      if (!store.activeModules[list.id]) continue;
      const current = store.hideoutLevels[list.id] ?? 0;
      const selected = store.targetLevels[list.id] ?? [];
      const needed = list.levels.some(lvl =>
        lvl.level > current && selected.includes(lvl.level) &&
        lvl.requirementItemIds.some(r => r.itemId === itemId)
      );
      if (needed) return i;
    }
    return 999;
  };

  const sortedMaterials = [...missingMaterials].sort((a, b) => {
    let cmp = 0;
    if (sort.key === 'priority') cmp = itemPriorityIndex(a.itemId) - itemPriorityIndex(b.itemId);
    else if (sort.key === 'name') cmp = (store.itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(store.itemsInfo[b.itemId]?.name ?? b.itemId);
    else if (sort.key === 'rarity') {
      const ra = rarityOrder[store.itemsInfo[a.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1;
      const rb = rarityOrder[store.itemsInfo[b.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1;
      cmp = rb - ra;
    }
    else if (sort.key === 'type') cmp = (store.itemsInfo[a.itemId]?.item_type ?? '').localeCompare(store.itemsInfo[b.itemId]?.item_type ?? '');
    return cmp * sort.dir;
  });

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
        {sortedMaterials
          .filter(m => !store.filterHideCompleted || !m.isCompleted)
          .map(mat => (
            <InventoryCard key={mat.itemId} {...mat}
              itemInfo={store.itemsInfo[mat.itemId]}
              refinerLevel={refinerLevel}
              onIncrement={() => store.incrementItem(mat.itemId)}
              onDecrement={() => store.decrementItem(mat.itemId)}
              onSet={val => store.setItemCount(mat.itemId, val)}
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
