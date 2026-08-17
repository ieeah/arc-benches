import { useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { ItemInfo } from '../types';
import { useAppStore } from '../store';
import { getRarityStyles, getRarityText } from '../lib/rarity';
import { iconUrl } from '../lib/icons';
import { BottomSheet } from './BottomSheet';
import { useListManager } from '../hooks/useListManager';
import type { FilterCategory, SortOption } from '../hooks/useListManager';
import { ListControls } from './ListControls';

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

/** Full-screen catalog picker over the whole item DB. Tap an item to pick it.
 *  Search bar is anchored to the bottom so the keyboard pushes it up,
 *  keeping results visible in the space above the keyboard. */
export const ItemPicker = ({ excludeIds = [], onPick, onClose }: {
  excludeIds?: string[];
  onPick: (item: ItemInfo) => void;
  onClose: () => void;
}) => {
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const inputRef = useRef<HTMLInputElement>(null);

  const exclude = useMemo(() => new Set(excludeIds), [excludeIds]);
  const pickableItems = useMemo(() => {
    return Object.values(itemsInfo).filter(i => !exclude.has(i.id));
  }, [itemsInfo, exclude]);

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
    items: pickableItems,
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

  // First tap on backdrop: dismiss keyboard (blur). Second tap: close picker.
  const handleBackdropClick = () => {
    if (document.activeElement === inputRef.current) inputRef.current?.blur();
    else onClose();
  };

  return (
    <BottomSheet
      title="Aggiungi oggetto"
      onClose={onClose}
      onBackdropClick={handleBackdropClick}
      overlayZ="z-[60]"
      bodyClassName="flex-1 min-h-0 px-3 pb-2 overflow-y-auto overscroll-contain"
      footer={
        <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              placeholder="Cerca tra tutti gli oggetti…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      }
    >
      {/* List controls in header area of sheet body */}
      <div className="mb-3 pt-1">
        <ListControls
          query={query}
          setQuery={setQuery}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          activeSortId={activeSortId}
          setActiveSortId={setActiveSortId}
          groupByEnabled={groupByEnabled}
          setGroupByEnabled={setGroupByEnabled}
          categories={FILTER_CATEGORIES}
          sortOptions={SORT_OPTIONS}
          showGroupingToggle={true}
          showSearch={false} // Hidden because search is in bottom footer
        />
      </div>

      {groupByEnabled ? (
        groupKeys.map(groupName => (
          <div key={groupName} className="mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
              {groupName}
            </h3>
            {groupedItems?.[groupName].map(item => {
              const { color } = getRarityStyles(item.rarity);
              return (
                <button key={item.id} onClick={() => onPick(item)}
                  className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] text-left active:scale-[0.99] transition-transform">
                  <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
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
                </button>
              );
            })}
          </div>
        ))
      ) : (
        processedItems.slice(0, 80).map(item => {
          const { color } = getRarityStyles(item.rarity);
          return (
            <button key={item.id} onClick={() => onPick(item)}
              className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] text-left active:scale-[0.99] transition-transform">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
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
            </button>
          );
        })
      )}

      {processedItems.length === 0 && (
        <p className="p-10 text-center text-gray-500 italic text-sm">Nessun oggetto trovato.</p>
      )}
    </BottomSheet>
  );
};
