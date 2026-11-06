import { useState, useRef, useEffect } from 'react';
import type { ItemInfo } from '@/types';
import { getRarityStyles } from '@/lib/rarity';
import { getItemCraftStatus, getWorkbenchName } from '@/lib/craft';
import { useAppStore } from '@/store';
import { getTraderPurchase } from '@/lib/traders';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { QuantityStepper } from '@/components/QuantityStepper';
import { CraftBadge } from '@/components/CraftBadge';
import { TraderBadge } from '@/components/TraderBadge';
import { useTranslation, getItemName } from '@/i18n';
import { useHoldAction } from '@/hooks/useHoldAction';
import { HoldProgressOverlay, BurstPing } from '@/components/HoldProgressOverlay';
import { useHoldConfig, type HoldConfig } from '@/lib/holdConfig';

export type InventoryCardProps = {
  itemId: string;
  owned: number;
  required: number;
  itemInfo: ItemInfo | undefined;
  refinerLevel: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (val: number) => void;
  onOpenDetail?: () => void;
  isExiting?: boolean;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  holdConfig?: Partial<HoldConfig>;
};

export const InventoryCard = ({
  itemId,
  owned,
  required,
  itemInfo,
  onIncrement,
  onDecrement,
  onSet,
  onOpenDetail,
  isExiting,
  onHoldStart,
  onHoldEnd,
  holdConfig: customHoldConfig,
}: InventoryCardProps) => {
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
    config: customHoldConfig,
  });

  const holdConfig = useHoldConfig();
  const effectiveHoldConfig = customHoldConfig ? { ...holdConfig, ...customHoldConfig } : holdConfig;

  // ── BAGLIORE ESPLOSIONE POST-COMPLETAMENTO (BURST) ANCHE DA STEPPER/SET ──
  const [internalBurst, setInternalBurst] = useState(false);
  const prevCompletedRef = useRef(isCompleted);

  useEffect(() => {
    if (!prevCompletedRef.current && isCompleted && !isHolding) {
      setInternalBurst(true);
      const timer = setTimeout(() => setInternalBurst(false), effectiveHoldConfig.stepperExit.feedbackMs);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted, isHolding, effectiveHoldConfig.stepperExit.feedbackMs]);

  const showBurst = bursting || internalBurst;

  return (
    <div
      style={{
        ...(isExiting ? { transitionDuration: `${effectiveHoldConfig.holdExit.fadeMs}ms` } : {}),
        ...(showBurst ? { animationDuration: `${effectiveHoldConfig.holdExit.feedbackMs}ms` } : {}),
      }}
    className={`relative flex flex-col p-2.5 rounded-[28px] card-concentric-28 squircle border-2 ${border} bg-white dark:bg-gray-900 transition-all select-none overflow-hidden ${
        isCompleted ? 'opacity-60 grayscale-[0.45]' : ''
      } ${isHolding && holdProgress > 0.1 ? 'animate-pulse' : ''} ${
        showBurst ? 'scale-[1.03] ring-4 ring-emerald-400/50' : ''
      } ${isExiting ? 'opacity-0 scale-95 pointer-events-none' : ''}`}
    >
      {/* ── BAGLIORE ESPLOSIONE FINALE (BURST) ── */}
      <BurstPing bursting={showBurst} durationMs={effectiveHoldConfig.holdExit.feedbackMs} className="rounded-[28px]" />

      {/* ── AREA ICONA OGGETTO (INTERATTIVA: PRESSIONE PROLUNGATA) ── */}
      <div
        className="relative cursor-pointer touch-pan-y active:scale-[0.98] transition-transform"
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
          className={`mb-2 ${!isCompleted ? glow : ''}`}
          imgClassName="max-w-full max-h-full object-contain"
          topLeftSlot={
            (craftResult.craftInfo !== null || traderPurchase !== null) ? (
              <div className="flex items-center gap-1 max-w-[calc(100%-1.5rem)]">
                {craftResult.craftInfo !== null && (
                  <CraftBadge
                    workbenchId={craftResult.craftInfo.workbenchId}
                    levelRequired={craftResult.craftInfo.levelRequired}
                    status={craftResult.status}
                    shortLabel={traderPurchase !== null}
                    title={craftTooltip}
                  />
                )}
                {traderPurchase !== null && (
                  <TraderBadge
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

      <div
        onClick={onOpenDetail}
        className="flex-1 min-w-0 mb-2 text-center cursor-pointer"
      >
        <h4 className="text-[13px] sm:text-sm font-bold truncate capitalize leading-tight mb-1 hover:text-blue-500 transition-colors">
          {displayName}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold font-mono">{owned}/{required}</p>
      </div>

      {/* ── CONTENITORE UNIFICATO STEPPER (Orizzontale Concentrico con Rarity Border Tint) ── */}
      <QuantityStepper
        orientation="horizontal"
        tempValue={tempValue}
        onTempValueChange={setTempValue}
        onBlur={handleBlur}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        rarity={itemInfo?.rarity}
        itemName={displayName}
      />
    </div>
  );
};
