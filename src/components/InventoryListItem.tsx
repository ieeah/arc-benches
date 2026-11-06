import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { getRarityStyles } from '@/lib/rarity';
import { getItemCraftStatus, getWorkbenchName } from '@/lib/craft';
import { useAppStore } from '@/store';
import { getTraderPurchase } from '@/lib/traders';
import { formatTimeRemaining } from '@/lib/expiration';
import { cn } from '@/lib/cn';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { QuantityStepper } from '@/components/QuantityStepper';
import { CraftBadge } from '@/components/CraftBadge';
import { TraderBadge } from '@/components/TraderBadge';
import type { ItemListDependency } from '@/store/selectors';
import { useTranslation, getItemName } from '@/i18n';
import { useHoldAction } from '@/hooks/useHoldAction';
import { HoldProgressOverlay, BurstPing } from '@/components/HoldProgressOverlay';
import { useHoldConfig } from '@/lib/holdConfig';

export type InventoryListItemProps = {
  itemId: string;
  owned: number;
  required: number;
  itemInfo: ItemInfo | undefined;
  refinerLevel: number;
  dependencies: ItemListDependency[];
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (val: number) => void;
  onOpenDetail?: () => void;
  isExiting?: boolean;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
};

export const InventoryListItem = ({
  itemId,
  owned,
  required,
  itemInfo,
  dependencies,
  onIncrement,
  onDecrement,
  onSet,
  onOpenDetail,
  isExiting,
  onHoldStart,
  onHoldEnd,
}: InventoryListItemProps) => {
  const { t, language } = useTranslation();
  const displayName = getItemName(itemInfo, language) || itemId.replace(/-/g, ' ');
  const isCompleted = owned >= required;
  const { border, glow } = getRarityStyles(itemInfo?.rarity);
  const currentLevels = useAppStore(s => s.currentLevels);
  const ownedBlueprints = useAppStore(s => s.ownedBlueprints);
  const craftMode = useAppStore(s => s.craftMode);
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const craftResult = getItemCraftStatus(itemInfo, currentLevels, ownedBlueprints, craftMode, itemsInfo);

  let craftTooltip: string | undefined = undefined;
  if (craftResult.craftInfo) {
    const benchName = getWorkbenchName(craftResult.craftInfo.workbenchId, t);
    if (craftResult.status === 'craftable') {
      craftTooltip = craftResult.craftInfo.workbenchId === 'workbench'
        ? t('stash.craftableNowBasic')
        : t('stash.craftableNowInWorkbench', { bench: benchName, level: craftResult.craftInfo.levelRequired });
    } else if (craftResult.status === 'needs_project') {
      const bpItem = craftResult.craftInfo.recipeId ? itemsInfo[craftResult.craftInfo.recipeId] : undefined;
      const bpName = bpItem ? getItemName(bpItem, language) : (craftResult.craftInfo.recipeId ?? '');
      craftTooltip = t('stash.requiresBlueprint', { name: bpName });
    } else {
      craftTooltip = t('stash.requiresWorkbenchLevelShort', {
        bench: benchName,
        level: craftResult.craftInfo.levelRequired,
        current: craftResult.currentBenchLevel,
      });
    }
  }
  const traderPurchase = getTraderPurchase(itemId);

  const [prevOwned, setPrevOwned] = useState(owned);
  const [tempValue, setTempValue] = useState(owned.toString());

  if (owned !== prevOwned) {
    setPrevOwned(owned);
    setTempValue(owned.toString());
  }

  const handleBlur = () => {
    let val = parseInt(tempValue);
    if (isNaN(val) || val < 0) {
      val = 0;
    }
    if (val > required) {
      val = required;
    }
    onSet(val);
    setTempValue(val.toString());
  };

  // ── PRESSIONE PROLUNGATA & TRANSIZIONE (HOLD-TO-ACTION CONDIVISA) ──
  const { isHolding, holdProgress, bursting, holdProps } = useHoldAction({
    isComplete: isCompleted,
    onComplete: () => onSet(required),
    onReset: () => onSet(0),
    onClick: onOpenDetail,
    onHoldStart,
    onHoldEnd,
  });

  const holdConfig = useHoldConfig();

  // ── BAGLIORE ESPLOSIONE POST-COMPLETAMENTO (BURST) ANCHE DA STEPPER/SET ──
  const [internalBurst, setInternalBurst] = useState(false);
  const prevCompletedRef = useRef(isCompleted);

  useEffect(() => {
    if (!prevCompletedRef.current && isCompleted && !isHolding) {
      setInternalBurst(true);
      const timer = setTimeout(() => setInternalBurst(false), holdConfig.stepperExit.feedbackMs);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted, isHolding, holdConfig.stepperExit.feedbackMs]);

  const showBurst = bursting || internalBurst;

  return (
    <div
      style={{
        ...(isExiting ? { transitionDuration: `${holdConfig.holdExit.fadeMs}ms` } : {}),
        ...(showBurst ? { animationDuration: `${holdConfig.holdExit.feedbackMs}ms` } : {}),
      }}
    className={`relative flex items-center gap-3 p-3 rounded-[24px] card-concentric-24 squircle border-2 ${border} bg-white dark:bg-gray-900 transition-all select-none overflow-hidden ${
        isCompleted ? 'opacity-60 grayscale-[0.45]' : 'shadow-xs'
      } ${isHolding && holdProgress > 0.1 ? 'animate-pulse' : ''} ${
        showBurst ? 'scale-[1.02] ring-4 ring-emerald-400/50' : ''
      } ${isExiting ? 'opacity-0 scale-95 pointer-events-none' : ''}`}
    >
      {/* ── BAGLIORE ESPLOSIONE FINALE (BURST) ── */}
      <BurstPing bursting={showBurst} durationMs={holdConfig.holdExit.feedbackMs} className="rounded-[24px]" />

      {/* ── COLONNA SX: ICONA (ingrandita e interattiva con hold-to-action) ── */}
      <div
        className="relative flex flex-col items-center shrink-0 cursor-pointer touch-pan-y active:scale-[0.98] transition-transform"
        {...holdProps}
        title={
          isCompleted
            ? t('stash.holdToReset')
            : t('stash.holdToComplete')
        }
      >
        <ItemCardFrameV2
          icon={itemInfo?.icon}
          alt={displayName}
          rarity={itemInfo?.rarity}
          fallbackText={itemId.replace(/-/g, ' ')}
          className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 ${!isCompleted ? glow : ''}`}
          imgClassName="max-w-full max-h-full object-contain"
          topLeftSlot={
            (craftResult.craftInfo !== null || traderPurchase !== null) ? (
              <div className="flex items-center gap-0.5">
                {craftResult.craftInfo !== null && (
                  <CraftBadge
                    size="sm"
                    workbenchId={craftResult.craftInfo.workbenchId}
                    levelRequired={craftResult.craftInfo.levelRequired}
                    status={craftResult.status}
                    shortLabel
                    title={craftTooltip}
                  />
                )}
                {traderPurchase !== null && (
                  <TraderBadge
                    size="sm"
                    trader={traderPurchase.trader}
                    price={traderPurchase.price}
                    title={t('stash.purchasableFromTrader', {
                      trader: traderPurchase.trader,
                      price: traderPurchase.price.toLocaleString(),
                    })}
                  />
                )}
              </div>
            ) : undefined
          }
          categoryBadge={<CategoryBadge itemType={itemInfo?.item_type} subcategory={itemInfo?.subcategory} bare />}
          completed={isCompleted && !isHolding}
          overlay={
            <HoldProgressOverlay
              isHolding={isHolding}
              holdProgress={holdProgress}
              isComplete={isCompleted}
            />
          }
        />
      </div>

      {/* ── COLONNA CENTRO: NOME & LISTE PER CUI È RICHIESTO ── */}
      <div
        onClick={onOpenDetail}
        className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer select-none pr-1"
      >
        <h4 className="text-sm sm:text-base font-bold truncate capitalize leading-tight text-gray-900 dark:text-gray-100 hover:text-blue-500 transition-colors">
          {displayName}
        </h4>

        {/* Posseduti / Richiesti sotto al titolo */}
        <p className="text-[11px] font-mono font-bold text-gray-400 mt-0.5">
          <span className="text-gray-800 dark:text-gray-200">{owned}</span> / {required}
        </p>

        {/* Lista banchi/liste dipendenti (1 visibile + contatore sotto se > 1) */}
        {dependencies.length > 0 ? (
          <div className="flex flex-col items-start gap-1 mt-1.5 max-w-full">
            {dependencies.slice(0, 1).map((dep, idx) => (
              <div
                key={`${dep.listId}-${dep.level}-${idx}`}
                className={`inline-flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold max-w-full ${
                  dep.isCustom
                    ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/40'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40'
                }`}
              >
                <span className="truncate">{dep.listName}</span>
                <span className="opacity-75 font-semibold shrink-0">Lvl {dep.level}</span>
                {dep.expirationDate && (
                  (() => {
                    const remaining = formatTimeRemaining(dep.expirationDate, language);
                    return (
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wide px-1 rounded-full shrink-0',
                        remaining.isExpired
                          ? 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300'
                          : remaining.urgent
                          ? 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300'
                          : remaining.warning
                          ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'text-gray-500 bg-gray-200/80 dark:bg-gray-700 dark:text-gray-300'
                      )}>
                        <Clock size={8} />
                        {remaining.isExpired ? t('lists.expired') : remaining.text}
                      </span>
                    );
                  })()
                )}
              </div>
            ))}

            {dependencies.length > 1 && (
              <div className="inline-flex items-center text-[10px] font-bold text-blue-500 dark:text-blue-400 pl-0.5">
                <span>+{dependencies.length - 1} {dependencies.length - 1 === 1 ? t('stash.moreOtherSingle') : t('stash.moreOtherPlural')}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 italic mt-1.5">{t('stash.noActiveObjectivesShort')}</p>
        )}
      </div>

      {/* ── COLONNA DX: STEPPER VERTICALE CONCENTRO CON RARITY BORDER TINT ── */}
      <div className="flex flex-col items-center shrink-0 pl-1 self-center">
        <QuantityStepper
          orientation="vertical"
          tempValue={tempValue}
          onTempValueChange={setTempValue}
          onBlur={handleBlur}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          rarity={itemInfo?.rarity}
          itemName={displayName}
        />
      </div>
    </div>
  );
};
