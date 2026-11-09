import { CheckCircle2, Hammer, ShoppingCart, ClipboardList, FileJson, Clock, Radar, Minus, Plus, Trash2 } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { getRarityStyles, getRarityText } from '@/lib/rarity';
import { getItemCraftStatus, getWorkbenchName } from '@/lib/craft';
import { useAppStore } from '@/store';
import { getTraderPurchase, getTraderDisplayName } from '@/lib/traders';
import { getLootAreas } from '@/lib/lootArea';
import { formatTimeRemaining } from '@/lib/expiration';
import { cn } from '@/lib/cn';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { BottomSheet } from '@/components/BottomSheet';
import type { ItemListDependency } from '@/store/selectors';
import { useTranslation, getItemName, getItemDescription, getRarityLabel } from '@/i18n';
import { isSectionActive } from '@/lib/sections';

interface StashItemDetailSheetProps {
  item: ItemInfo;
  owned: number;
  required: number;
  refinerLevel: number;
  dependencies: ItemListDependency[];
  onClose: () => void;
  onOpenOverrides?: (itemId: string) => void;
}

export const StashItemDetailSheet = ({
  item,
  owned,
  required,
  dependencies,
  onClose,
  onOpenOverrides,
}: StashItemDetailSheetProps) => {
  const { t, language } = useTranslation();
  const { glow } = getRarityStyles(item.rarity);
  const currentLevels = useAppStore(s => s.currentLevels);
  const ownedBlueprints = useAppStore(s => s.ownedBlueprints);
  const craftMode = useAppStore(s => s.craftMode);
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const raidPlan = useAppStore(s => s.raidPlan);
  const isRaidActive = useAppStore(s => isSectionActive('raid', s));
  const addRaidItem = useAppStore(s => s.addRaidItem);
  const updateRaidItemTarget = useAppStore(s => s.updateRaidItemTarget);
  const removeRaidItem = useAppStore(s => s.removeRaidItem);

  const craftResult = getItemCraftStatus(item, currentLevels, ownedBlueprints, craftMode, itemsInfo);
  const traderPurchase = getTraderPurchase(item.id);
  const lootAreas = getLootAreas(item.loot_area, 15);
  const isCompleted = owned >= required;
  const missing = Math.max(0, required - owned);
  const progressPercent = required > 0 ? Math.min(100, Math.round((owned / required) * 100)) : 100;
  const displayName = getItemName(item, language);
  const displayDesc = getItemDescription(item, language);

  const plannedItem = raidPlan.items.find(i => i.itemId === item.id);

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
                  onOpenOverrides(item.id);
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
            <span className={`text-xs font-bold uppercase tracking-wide ${getRarityText(item.rarity)}`}>
              {getRarityLabel(item.rarity, language)}
            </span>
            {item.subcategory && (
              <>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {item.subcategory}
                </span>
              </>
            )}
          </div>
        </div>
      }
    >
      {/* ── SEZIONE 1: ICONA HERO PULITA & PROGRESSO INVENTARIO ── */}
      <div className="flex items-center gap-4 p-4 rounded-[24px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
        <ItemCardFrameV2
          icon={item.icon}
          alt={item.name}
          rarity={item.rarity}
          borderRadius={14}
          fallbackText={item.id.replace(/-/g, ' ')}
          className={`w-20 h-20 shrink-0 ${glow}`}
          imgClassName="max-w-full max-h-full object-contain"
          categoryBadge={<CategoryBadge itemType={item.item_type} subcategory={item.subcategory} bare />}
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

      {/* ── SEZIONE PIANIFICAZIONE RAID (Interoperabilità Stash ↔ Raid) ── */}
      {isRaidActive && (
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
                  onClick={() => addRaidItem(item.id, missing)}
                  className="w-full h-11 px-4 rounded-[18px] bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  aria-label={t('stash.planMissingAria', { count: missing, name: displayName })}
                >
                  <Radar size={16} className="shrink-0 stroke-[2.5]" />
                  <span>{t('stash.planMissingInRaid', { count: missing })}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => addRaidItem(item.id, 1)}
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

      {/* ── SEZIONE 2: FABBRICAZIONE NEL BANCO (se craftabile) ── */}
      {craftResult.craftInfo !== null && (() => {
        const benchName = getWorkbenchName(craftResult.craftInfo.workbenchId, t);
        const isCraftable = craftResult.status === 'craftable';
        const bpItem = craftResult.craftInfo.recipeId ? itemsInfo[craftResult.craftInfo.recipeId] : undefined;
        const bpName = bpItem ? getItemName(bpItem, language) : (craftResult.craftInfo.recipeId ?? 'Blueprint');

        return (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-lg ${
                  isCraftable
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Hammer size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {t('stash.craftableInWorkbench', { bench: benchName })}
                </p>
                <p className="text-[11px] text-gray-500">
                  {craftResult.status === 'needs_project'
                    ? t('stash.requiresBlueprint', { name: bpName })
                    : craftResult.craftInfo.workbenchId === 'workbench'
                      ? t('stash.craftableNowBasic')
                      : t('stash.requiresWorkbenchLevel', {
                          bench: benchName,
                          level: craftResult.craftInfo.levelRequired,
                          current: craftResult.currentBenchLevel,
                        })}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                isCraftable
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {isCraftable
                ? t('stash.craftableNow')
                : craftResult.status === 'needs_project'
                  ? t('stash.locked')
                  : craftResult.craftInfo.workbenchId === 'workbench'
                    ? t('stash.available')
                    : `Lvl ${craftResult.craftInfo.levelRequired}`}
            </span>
          </div>
        );
      })()}

      {/* ── SEZIONE COMMERCIANTE (se acquistabile) ── */}
      {traderPurchase !== null && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300">
              <ShoppingCart size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {t('stash.purchasableFromTraderDetail')}
              </p>
              <p className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">
                {getTraderDisplayName(traderPurchase.trader)} • {traderPurchase.price.toLocaleString(language)} {t('common.coins')}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
            {t('stash.available')}
          </span>
        </div>
      )}

      {/* ── SEZIONE 3: ZONE DI LOOT & PROVENIENZA ── */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {t('stash.lootAreasTitle')}
        </h3>
        {lootAreas.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {lootAreas.map((area, idx) => (
              <div
                key={`${area.id}-${idx}`}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50"
              >
                <div className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-2xs">
                  {area.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                    {area.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{t('stash.containerMap')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-400 italic">
            {t('stash.noLootArea')}
          </div>
        )}
      </div>

      {/* ── SEZIONE 4: FABBISOGNO DETTAGLIATO PER BANCO / LISTA ── */}
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

      {/* ── SEZIONE 5: DESCRIZIONE & LORE (se disponibile) ── */}
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
