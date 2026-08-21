import { useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { useAppStore } from '@/store';
import { getRarityText } from '@/lib/rarity';
import { BottomSheet } from '@/components/BottomSheet';
import { ItemCardFrame } from '@/components/ItemCardFrame';
import { useListManager } from '@/hooks/useListManager';
import { useTranslation, getItemName, getItemSearchFields, getRarityLabel } from '@/i18n';

interface ItemPickerProps {
  excludeIds?: string[];
  onPick: (item: ItemInfo) => void;
  onClose: () => void;
}

export const ItemPicker = ({ excludeIds, onPick, onClose }: ItemPickerProps) => {
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const exclude = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useTranslation();

  // Exclude hidden items (unless picked already) and blueprints/cosmetics
  const pickableItems = useMemo(() => {
    return Object.values(itemsInfo).filter(item => {
      if (item.hidden && !exclude.has(item.id)) return false;
      if (item.item_type === 'Blueprint' || item.item_type === 'Cosmetic') return false;
      return !exclude.has(item.id);
    });
  }, [itemsInfo, exclude]);

  const {
    query,
    setQuery,
    debouncedQuery,
    processedItems,
  } = useListManager<ItemInfo>({
    items: pickableItems,
    search: {
      fields: getItemSearchFields,
    },
  });

  // First tap on backdrop: dismiss keyboard (blur). Second tap: close picker.
  const handleBackdropClick = () => {
    if (document.activeElement === inputRef.current) inputRef.current?.blur();
    else onClose();
  };

  // Use debouncedQuery so the list appears only when results are already filtered,
  // avoiding the flash of the full unfiltered list on the first keypress.
  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <BottomSheet
      title={t('customLists.addItem')}
      onClose={onClose}
      onBackdropClick={handleBackdropClick}
      overlayZ="z-[60]"
      bodyClassName="flex-1 min-h-0 px-3 pb-2 overflow-y-auto overscroll-contain"
      footer={
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400 pointer-events-none" size={16} />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('common.search')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={t('common.close')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Empty / Initial State */}
      {!hasQuery && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Search size={32} className="text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
            Cerca un oggetto per aggiungerlo
          </p>
        </div>
      )}

      {/* Results */}
      {hasQuery && (
        <div data-list-container="compact">
          {processedItems.map(item => {
            const displayName = getItemName(item, language);
            return (
              <button key={item.id} onClick={() => onPick(item)}
                className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] card-concentric-20 squircle text-left active:scale-[0.99] transition-transform cursor-pointer">
                <ItemCardFrame
                  icon={item.icon}
                  alt={displayName}
                  rarity={item.rarity}
                  fallbackText={item.id}
                  className="w-11 h-11 shrink-0"
                  imgClassName="max-w-[85%] max-h-[85%] object-contain"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{displayName}</p>
                  <p className="text-[10px] text-gray-400">
                    <span className={`font-bold ${getRarityText(item.rarity)}`}>{getRarityLabel(item.rarity, language)}</span> · {item.item_type}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {hasQuery && processedItems.length === 0 && (
        <p className="p-10 text-center text-gray-500 italic text-sm">Nessun oggetto trovato.</p>
      )}
    </BottomSheet>
  );
};
