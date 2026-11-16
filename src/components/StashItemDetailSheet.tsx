import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Hammer,
  ClipboardList,
  FileJson,
  Clock,
  Radar,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import type { ItemInfo } from '@/types';
import { getRarityStyles, getRarityText } from '@/lib/rarity';
import { useAppStore } from '@/store';
import { formatTimeRemaining } from '@/lib/expiration';
import { cn } from '@/lib/cn';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { BottomSheet } from '@/components/BottomSheet';
import type { ItemListDependency } from '@/store/selectors';
import { useTranslation, getItemName, getItemDescription, getRarityLabel } from '@/i18n';
import { isSectionActive } from '@/lib/sections';
import { getBaseItem, getBaseItemForVariant } from '@/lib/baseItems';
import { ItemRecipeDetails } from '@/components/ItemRecipeDetails';

type StashItemDetailSheetProps = {
  item: ItemInfo;
  owned: number;
  required: number;
  refinerLevel: number;
  dependencies: ItemListDependency[];
  onClose: () => void;
  onOpenOverrides?: (itemId: string) => void;
};

export const StashItemDetailSheet = ({
  item: initialItem,
  owned,
  required,
  dependencies,
  onClose,
  onOpenOverrides,
}: StashItemDetailSheetProps) => {
  const { t, language } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const raidPlan = useAppStore((s) => s.raidPlan);
  const isRaidActive = useAppStore((s) => isSectionActive('raid', s));
  const addRaidItem = useAppStore((s) => s.addRaidItem);
  const updateRaidItemTarget = useAppStore((s) => s.updateRaidItemTarget);
  const removeRaidItem = useAppStore((s) => s.removeRaidItem);

  // Stack di cronologia per consentire la navigazione a ritroso tra materiali/ingredienti
  const [history, setHistory] = useState<ItemInfo[]>([initialItem]);
  const [prevInitialId, setPrevInitialId] = useState<string>(initialItem.id);

  if (initialItem.id !== prevInitialId) {
    setPrevInitialId(initialItem.id);
    setHistory([initialItem]);
  }

  const activeItem = history[history.length - 1];
  const prevItem = history.length > 1 ? history[history.length - 2] : null;
  const isViewingOriginalStashItem = activeItem.id === initialItem.id;

  const navigateTo = (next: ItemInfo) => {
    setHistory((prev) => [...prev, next]);
  };

  const handleBack = () => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const { glow } = getRarityStyles(activeItem.rarity);
  const isCompleted = owned >= required;
  const missing = Math.max(0, required - owned);
  const progressPercent = required > 0 ? Math.min(100, Math.round((owned / required) * 100)) : 100;
  const displayName = getItemName(activeItem, language);
  const displayDesc = getItemDescription(activeItem, language);

  const plannedItem = raidPlan.items.find((i) => i.itemId === initialItem.id);

  const baseDef = useMemo(() => {
    return getBaseItem(activeItem.id) ?? getBaseItemForVariant(activeItem.id);
  }, [activeItem.id]);

  return (
    <BottomSheet
      title={displayName}
      onClose={onClose}
      bodyClassName="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-8 space-y-5"
      titleSlot={
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold truncate text-gray-900 dark:text-gray-100">{displayName}</h2>
            {import.meta.env.DEV && onOpenOverrides && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOverrides(activeItem.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                title={t('catalog.editInOverrides')}
              >
                <FileJson size={13} />
                <span>Overrides</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-bold uppercase tracking-wide ${getRarityText(activeItem.rarity)}`}>
              {getRarityLabel(activeItem.rarity, language)}
            </span>
            {activeItem.subcategory && (
              <>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {activeItem.subcategory}
                </span>
              </>
            )}
          </div>
        </div>
      }
    >
      {/* ── BARRA CRONOLOGIA INDIETRO ── */}
      {prevItem && (
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-2xs group"
          >
            <ArrowLeft size={13} className="text-blue-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>{t('itemDetail.backTo', { name: getItemName(prevItem, language) })}</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-gray-400">
            {t('itemDetail.historyStep', { current: history.length, total: history.length })}
          </span>
        </div>
      )}

      {/* ── SEZIONE 1: ICONA HERO & PROGRESSO INVENTARIO ── */}
      {isViewingOriginalStashItem ? (
        <div className="flex items-center gap-4 p-4 rounded-[24px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
          <ItemCardFrameV2
            icon={initialItem.icon}
            alt={displayName}
            rarity={initialItem.rarity}
            itemType={initialItem.item_type}
            subcategory={initialItem.subcategory}
            borderRadius={14}
            fallbackText={initialItem.id.replace(/-/g, ' ')}
            className={`w-20 h-20 shrink-0 ${glow}`}
            imgClassName="max-w-full max-h-full object-contain"
            categoryBadge={<CategoryBadge itemType={initialItem.item_type} subcategory={initialItem.subcategory} bare />}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500">{t('stash.stashStatus')}</span>
              <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                {owned} / {required}
              </span>
            </div>

            {/* Barra di avanzamento */}
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-500">
                  <CheckCircle2 size={13} /> {t('stash.quotaCompleted')}
                </span>
              ) : (
                <span className="font-bold text-amber-500">
                  {t('stash.missingUnits', { count: missing })}
                </span>
              )}
              <span className="text-gray-400 font-mono">{progressPercent}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-[24px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
          <ItemCardFrameV2
            icon={activeItem.icon}
            alt={displayName}
            rarity={activeItem.rarity}
            itemType={activeItem.item_type}
            subcategory={activeItem.subcategory}
            borderRadius={14}
            fallbackText={activeItem.id.replace(/-/g, ' ')}
            className={`w-16 h-16 shrink-0 ${glow}`}
            imgClassName="max-w-full max-h-full object-contain"
            categoryBadge={<CategoryBadge itemType={activeItem.item_type} subcategory={activeItem.subcategory} bare />}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{displayName}</h3>
            <p className="text-xs text-gray-500 truncate">
              {activeItem.item_type} {activeItem.subcategory ? `· ${activeItem.subcategory}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── SEZIONE PIANIFICAZIONE RAID (solo per l'oggetto principale di stash) ── */}
      {isViewingOriginalStashItem && isRaidActive && (
        <div className="p-3.5 rounded-[22px] bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <Radar size={15} />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                {t('stash.raidPlanSectionTitle')}
              </span>
            </div>
            {plannedItem && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                <span>{t('stash.inRaidPlanBadge')}</span>
              </span>
            )}
          </div>

          {plannedItem ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  {t('stash.plannedTargetLabel')}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-black font-mono text-gray-900 dark:text-gray-100">
                    ×{plannedItem.targetQuantity}
                  </span>
                  {plannedItem.foundQuantity > 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      ({t('stash.foundInRaid', { count: plannedItem.foundQuantity })})
                    </span>
                  )}
                </div>
              </div>

              {/* Stepper +/- e rimozione */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (plannedItem.targetQuantity <= 1) {
                      removeRaidItem(plannedItem.id);
                    } else {
                      updateRaidItemTarget(plannedItem.id, plannedItem.targetQuantity - 1);
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={t('stash.decreaseRaidTarget')}
                  title={t('stash.decreaseRaidTarget')}
                >
                  <Minus size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => updateRaidItemTarget(plannedItem.id, plannedItem.targetQuantity + 1)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={t('stash.increaseRaidTarget')}
                  title={t('stash.increaseRaidTarget')}
                >
                  <Plus size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => removeRaidItem(plannedItem.id)}
                  className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/60 active:scale-95 transition-all cursor-pointer shadow-xs ml-1 focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label={t('stash.removeFromRaidPlan')}
                  title={t('stash.removeFromRaidPlan')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-1">
              {missing > 0 ? (
                <button
                  type="button"
                  onClick={() => addRaidItem(initialItem.id, missing)}
                  className="w-full h-11 px-4 rounded-[18px] bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  aria-label={t('stash.planMissingAria', { count: missing, name: displayName })}
                >
                  <Radar size={16} className="shrink-0 stroke-[2.5]" />
                  <span>{t('stash.planMissingInRaid', { count: missing })}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => addRaidItem(initialItem.id, 1)}
                  className="w-full h-11 px-4 rounded-[18px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  aria-label={t('stash.planExtraAria', { name: displayName })}
                >
                  <Radar size={16} className="shrink-0" />
                  <span>{t('stash.planExtraInRaid')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SEZIONE 2: NUOVA SEZIONE UNIFICATA RICETTE, UPGRADE, RIPARAZIONE, RICICLO & FONTI ── */}
      <ItemRecipeDetails
        item={activeItem}
        baseDef={baseDef}
        onSelectItem={(id) => {
          const it = itemsInfo[id];
          if (it) navigateTo(it);
        }}
      />

      {/* ── SEZIONE 3: FABBISOGNO PER BANCO / LISTA (solo per l'oggetto principale di stash) ── */}
      {isViewingOriginalStashItem && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {t('stash.requiredByLists', { count: dependencies.length })}
            </h3>
            <span className="text-xs font-mono font-semibold text-gray-400">
              {t('stash.totalRequiredLabel', { count: required })}
            </span>
          </div>

          {dependencies.length > 0 ? (
            <div className="space-y-2">
              {dependencies.map((dep, idx) => (
                <div
                  key={`${dep.listId}-${dep.level}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        dep.isCustom
                          ? 'bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400'
                          : 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {dep.isCustom ? <ClipboardList size={16} /> : <Hammer size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {dep.listName}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[11px] text-gray-500 font-semibold">
                          {t('benches.level')} {dep.level}
                        </span>
                        {dep.expirationDate && (
                          (() => {
                            const remaining = formatTimeRemaining(dep.expirationDate, language);
                            return (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
                                  remaining.isExpired
                                    ? 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300'
                                    : remaining.urgent
                                    ? 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300'
                                    : remaining.warning
                                    ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'text-gray-500 bg-gray-200/80 dark:bg-gray-700 dark:text-gray-300'
                                )}
                              >
                                <Clock size={9} />
                                {remaining.isExpired ? t('lists.expired') : remaining.text}
                              </span>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      ×{dep.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-400 italic">
              {t('stash.noActiveObjectives')}
            </div>
          )}
        </div>
      )}

      {/* ── SEZIONE 4: DESCRIZIONE & LORE ── */}
      {displayDesc && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            {t('stash.description')}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {displayDesc}
          </p>
        </div>
      )}
    </BottomSheet>
  );
};
