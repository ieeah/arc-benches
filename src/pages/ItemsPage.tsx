import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { ItemInfo } from '../types';
import { useAppStore } from '../store';
import { getRarityStyles, getRarityText } from '../lib/rarity';
import { iconUrl } from '../lib/icons';
import { SectionHeader } from '../components/SectionHeader';
import { IconButton } from '../components/IconButton';
import { ItemDetailSheet } from '../components/ItemDetailSheet';
import { useListManager } from '../hooks/useListManager';
import type { FilterCategory, SortOption } from '../hooks/useListManager';
import { ListControls } from '../components/ListControls';

const RARITY_WEIGHTS: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const getRarityWeight = (rarity: string) => RARITY_WEIGHTS[rarity.toLowerCase()] || 0;

const FILTER_CATEGORIES: FilterCategory<ItemInfo>[] = [
  { id: 'all', label: 'Tutti', predicate: () => true },
  { id: 'materials', label: 'Materiali', predicate: i => ['basic material', 'topside material', 'refined material', 'advanced material', 'material', 'recyclable'].includes(i.item_type.toLowerCase()) },
  { id: 'equipment', label: 'Armi & Equip', predicate: i => ['weapon', 'throwable', 'gadget', 'modification', 'augment', 'shield', 'deployable'].includes(i.item_type.toLowerCase()) },
  { id: 'consumables', label: 'Consumabili', predicate: i => ['consumable', 'quick use', 'ammunition'].includes(i.item_type.toLowerCase()) },
  { id: 'blueprints', label: 'Blueprint', predicate: i => i.item_type.toLowerCase() === 'blueprint' },
  { id: 'other', label: 'Altro', predicate: i => !['basic material', 'topside material', 'refined material', 'advanced material', 'material', 'recyclable', 'weapon', 'throwable', 'gadget', 'modification', 'augment', 'shield', 'deployable', 'consumable', 'quick use', 'ammunition', 'blueprint'].includes(i.item_type.toLowerCase()) },
];

const SORT_OPTIONS: SortOption<ItemInfo>[] = [
  { id: 'name_asc', label: 'Nome (A-Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  { id: 'name_desc', label: 'Nome (Z-A)', compare: (a, b) => b.name.localeCompare(a.name) },
  { id: 'rarity_desc', label: 'Rarità (Decrescente)', compare: (a, b) => getRarityWeight(b.rarity) - getRarityWeight(a.rarity) || a.name.localeCompare(b.name) },
  { id: 'value_desc', label: 'Valore (Decrescente)', compare: (a, b) => b.value - a.value || a.name.localeCompare(b.name) },
  { id: 'value_asc', label: 'Valore (Crescente)', compare: (a, b) => a.value - b.value || a.name.localeCompare(b.name) },
];

export const ItemsPage = ({ onBack }: { onBack: () => void }) => {
  const store = useAppStore();
  const [selected, setSelected] = useState<ItemInfo | null>(null);
  const refinerLevel = store.getRefinerLevel();

  const allItems = Object.values(store.itemsInfo);

  const {
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
  } = useListManager<ItemInfo>({
    items: allItems,
    search: {
      fields: item => [item.name, item.id],
    },
    filters: {
      categories: FILTER_CATEGORIES,
      defaultCategoryId: 'all',
    },
    sorting: {
      options: SORT_OPTIONS,
      defaultSortId: 'name_asc',
    },
    grouping: {
      groupKey: item => item.item_type || 'Altro',
    },
  });

  return (
    <div className="pb-28">
      <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="mb-3">
          <SectionHeader title="Oggetti"
            leading={
              <IconButton onClick={onBack} title="Indietro">
                <ArrowLeft size={16} />
              </IconButton>
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
          groupByEnabled={groupByEnabled}
          setGroupByEnabled={setGroupByEnabled}
          searchPlaceholder="Cerca un oggetto…"
          categories={FILTER_CATEGORIES}
          sortOptions={SORT_OPTIONS}
          showGroupingToggle={true}
        />
      </div>

      <div className="p-3">
        {groupByEnabled ? (
          groupKeys.map(groupName => (
            <div key={groupName} className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                {groupName}
              </h3>
              {groupedItems?.[groupName].map(item => {
                const { color } = getRarityStyles(item.rarity);
                return (
                  <button key={item.id} onClick={() => setSelected(item)}
                    className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] text-left active:scale-[0.99] transition-transform">
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      {item.icon
                        ? <img src={iconUrl(item.icon)} alt={item.name} loading="lazy" decoding="async" className="max-w-[85%] max-h-[85%] object-contain" />
                        : <span className="text-[8px] text-gray-400">{item.id}</span>}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400">
                        <span className={`font-bold ${getRarityText(item.rarity)}`}>{item.rarity}</span> · {item.item_type}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          processedItems.map(item => {
            const { color } = getRarityStyles(item.rarity);
            return (
              <button key={item.id} onClick={() => setSelected(item)}
                className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] text-left active:scale-[0.99] transition-transform">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  {item.icon
                    ? <img src={iconUrl(item.icon)} alt={item.name} loading="lazy" decoding="async" className="max-w-[85%] max-h-[85%] object-contain" />
                    : <span className="text-[8px] text-gray-400">{item.id}</span>}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400">
                    <span className={`font-bold ${getRarityText(item.rarity)}`}>{item.rarity}</span> · {item.item_type}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
              </button>
            );
          })
        )}

        {processedItems.length === 0 && (
          <p className="p-10 text-center text-gray-500 italic text-sm">Nessun oggetto trovato.</p>
        )}
      </div>

      {selected && <ItemDetailSheet item={selected} refinerLevel={refinerLevel} onClose={() => setSelected(null)} />}
    </div>
  );
};
