import { useMemo, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { useAppStore } from '@/store';
import { getRarityText } from '@/lib/rarity';
import { BottomSheet } from '@/components/BottomSheet';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { useListManager } from '@/hooks/useListManager';
import { useTranslation, getItemName, getItemSearchFields, getRarityLabel, getItemSearchMatch } from '@/i18n';
import { isPickableItem } from '@/lib/pickableItems';
import {
  getBaseItem,
  getBaseItemForVariant,
  isVariantItem,
} from '@/lib/baseItems';

type ItemPickerProps = {
  excludeIds?: string[];
  /** Rewards can be any catalog item (blueprints, cosmetics, currencies…); deliveries can't. */
  includeAll?: boolean;
  /** Permetti la selezione di blueprint (es. raid plan). */
  includeBlueprints?: boolean;
  onPick: (item: ItemInfo) => void;
  onClose: () => void;
};

export const ItemPicker = ({
  excludeIds,
  includeAll = false,
  includeBlueprints = false,
  onPick,
  onClose,
}: ItemPickerProps) => {
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const exclude = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useTranslation();

  // Lista oggetti selezionabili:
  // - in modalità standard (fabbisogno utente / raid):
  //     mostriamo i Base Items (es. 'anvil' -> 'Incudine') e gli oggetti indipendenti.
  //     Le varianti specifiche (es. 'anvil-i', 'anvil-iv', 'amplified-anvil'...) sono nascoste.
  // - in modalità includeAll (ricompense pass/quest/backoffice):
  //     tutto è visibile e selezionabile.
  const pickableItems = useMemo(() => {
    const all = Object.values(itemsInfo);
    return all.filter((item) => {
      if (!isPickableItem(item, { includeAll, includeBlueprints, excludedIds: exclude })) {
        return false;
      }
      if (!includeAll && isVariantItem(item.id)) {
        return false;
      }
      return true;
    });
  }, [itemsInfo, exclude, includeAll, includeBlueprints]);

  // Campi di ricerca multi-lingua con estensione ai Base Items e alle loro varianti
  const getSearchFields = useCallback(
    (item: ItemInfo): string[] => {
      const base = getItemSearchFields(item);
      const baseDef = getBaseItem(item.id);
      if (!baseDef) return base;

      const extra: string[] = [baseDef.name];
      if (baseDef.translations) {
        for (const tr of Object.values(baseDef.translations)) {
          if (tr.name) extra.push(tr.name);
        }
      }
      for (const vId of baseDef.variantItemIds) {
        extra.push(vId);
        const vItem = itemsInfo[vId];
        if (vItem) {
          extra.push(vItem.name);
          if (vItem.translations) {
            for (const tr of Object.values(vItem.translations)) {
              if (tr.name) extra.push(tr.name);
            }
          }
        }
      }
      return Array.from(new Set([...base, ...extra]));
    },
    [itemsInfo],
  );

  const {
    query,
    setQuery,
    debouncedQuery,
    processedItems,
  } = useListManager<ItemInfo>({
    items: pickableItems,
    search: {
      fields: getSearchFields,
    },
  });

  // First tap on backdrop: dismiss keyboard (blur). Second tap: close picker.
  const handleBackdropClick = () => {
    if (document.activeElement === inputRef.current) inputRef.current?.blur();
    else onClose();
  };

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
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
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
            {t('itemPicker.searchPrompt')}
          </p>
        </div>
      )}

      {/* Results */}
      {hasQuery && (
        <div data-list-container="compact">
          {processedItems.map((item) => {
            const displayName = getItemName(item, language);
            const match = getItemSearchMatch(item, debouncedQuery, displayName);
            const baseDef = getBaseItem(item.id);
            const parentBase = getBaseItemForVariant(item.id);

            return (
              <div
                key={item.id}
                className="w-full p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] card-concentric-20 squircle text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onPick(item)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <ItemCardFrameV2
                      icon={item.icon}
                      alt={displayName}
                      rarity={item.rarity}
                      fallbackText={item.id}
                      className="w-11 h-11 shrink-0"
                      imgClassName="max-w-[85%] max-h-[85%] object-contain"
                      compact
                      thumb
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{displayName}</p>
                      <p className="text-[10px] text-gray-400">
                        <span className={`font-bold ${getRarityText(item.rarity)}`}>
                          {getRarityLabel(item.rarity, language)}
                        </span>{' '}
                        · {item.item_type}
                        {baseDef && baseDef.variantItemIds.length > 0 && !includeAll && (
                          <span className="ml-1 text-gray-500 font-semibold">
                            ({baseDef.variantItemIds.length} varianti)
                          </span>
                        )}
                        {includeAll && parentBase && (
                          <span className="ml-1 text-indigo-500 font-semibold">
                            (Variante di {parentBase.name})
                          </span>
                        )}
                      </p>
                      {match && (
                        <p className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {match.kind === 'translation' ? (
                            <>
                              <span
                                className="shrink-0 px-1 py-px font-bold uppercase rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                                style={{ fontSize: 9 }}
                              >
                                {match.lang}
                              </span>
                              <span className="truncate italic">{match.value}</span>
                            </>
                          ) : (
                            <span className="font-mono truncate"># {item.id}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Nel backoffice / includeAll, se è un Base Item possiamo mostrare direttamente i pulsanti per le sue varianti */}
                  {includeAll && baseDef && baseDef.variantItemIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-w-[150px] justify-end">
                      {baseDef.variantItemIds.slice(0, 4).map((vId) => {
                        const vItem = itemsInfo[vId];
                        if (!vItem) return null;
                        return (
                          <button
                            key={vId}
                            type="button"
                            onClick={() => onPick(vItem)}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer truncate max-w-[70px]"
                            title={getItemName(vItem, language)}
                          >
                            {vId.replace(`${baseDef.id}-`, '')}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasQuery && processedItems.length === 0 && (
        <p className="p-10 text-center text-gray-500 italic text-sm">{t('itemPicker.noItemsFound')}</p>
      )}
    </BottomSheet>
  );
};
