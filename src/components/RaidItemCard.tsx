import { useState } from "react";
import type { ItemInfo, RaidItem } from "@/types";
import { getRarityStyles } from "@/lib/rarity";
import { ItemCardFrameV2 } from "@/components/ItemCardFrameV2";
import { CategoryBadge } from "@/components/CategoryBadge";
import { QuantityStepper } from "@/components/QuantityStepper";
import { useTranslation, getItemName } from "@/i18n";
import { useHoldAction } from "@/hooks/useHoldAction";
import { HoldProgressOverlay, BurstPing } from "@/components/HoldProgressOverlay";

export type RaidItemCardProps = {
  raidItem: RaidItem;
  itemInfo?: ItemInfo;
  stashOwned?: number;
  stashRequired?: number;
  onIncrementFound: () => void;
  onDecrementFound: () => void;
  onSetFound: (val: number) => void;
  onComplete: () => void;
  onResetProgress: () => void;
  onOpenEditModal?: () => void;
  onRemove?: () => void;
  /** Se true, nasconde il pulsante di rimozione (Focus Mode attiva) */
  hideDelete?: boolean;
};

export const RaidItemCard = ({
  raidItem,
  itemInfo,
  stashOwned,
  stashRequired,
  onIncrementFound,
  onDecrementFound,
  onSetFound,
  onComplete,
  onResetProgress,
}: RaidItemCardProps) => {
  const { t, language } = useTranslation();
  const displayName =
    getItemName(itemInfo, language) || raidItem.itemId.replace(/-/g, " ");

  const isComplete = raidItem.foundQuantity >= raidItem.targetQuantity;
  const { border, glow } = getRarityStyles(itemInfo?.rarity);

  // ── STEPPER CONTROLLO INTERNO ──
  const [prevFound, setPrevFound] = useState(raidItem.foundQuantity);
  const [tempValue, setTempValue] = useState(raidItem.foundQuantity.toString());

  if (raidItem.foundQuantity !== prevFound) {
    setPrevFound(raidItem.foundQuantity);
    setTempValue(raidItem.foundQuantity.toString());
  }

  const handleBlur = () => {
    let val = parseInt(tempValue, 10);
    if (isNaN(val) || val < 0) {
      val = 0;
    }
    onSetFound(val);
    setTempValue(val.toString());
  };

  // ── PRESSIONE PROLUNGATA & TRANSIZIONE (HOLD-TO-ACTION CONDIVISA) ──
  const { isHolding, holdProgress, bursting, holdProps } = useHoldAction({
    isComplete,
    onComplete,
    onReset: onResetProgress,
  });

  return (
    <div
      className={`relative flex flex-col p-2.5 rounded-[24px] card-concentric-24 squircle border-2 ${border} bg-white dark:bg-gray-900 transition-all select-none overflow-hidden ${
        isComplete ? "opacity-60 grayscale-[0.45]" : ""
      } ${isHolding && holdProgress > 0.1 ? "animate-pulse" : ""} ${
        bursting ? "scale-[1.03] ring-4 ring-emerald-400/50" : ""
      }`}
    >
      {/* ── BAGLIORE ESPLOSIONE FINALE (BURST) ── */}
      <BurstPing bursting={bursting} className="rounded-[24px]" />

      {/* ── AREA ICONA OGGETTO (INTERATTIVA: PRESSIONE PROLUNGATA) ── */}
      <div
        className="relative cursor-pointer touch-pan-y active:scale-[0.98] transition-transform"
        {...holdProps}
        title={
          isComplete
            ? t("stash.holdToReset")
            : t("stash.holdToComplete")
        }
      >
        <ItemCardFrameV2
          icon={itemInfo?.icon}
          alt={displayName}
          rarity={itemInfo?.rarity}
          itemType={itemInfo?.item_type}
          subcategory={itemInfo?.subcategory}
          fallbackText={raidItem.itemId.replace(/-/g, " ")}
          className={`mb-1.5 ${!isComplete ? glow : ""}`}
          imgClassName="max-w-full max-h-full object-contain"
          categoryBadge={
            <CategoryBadge
              itemType={itemInfo?.item_type}
              subcategory={itemInfo?.subcategory}
              bare
            />
          }
          barRightSlot={
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-black font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              ×{raidItem.targetQuantity}
            </span>
          }
          completed={isComplete && !isHolding}
          overlay={
            <HoldProgressOverlay
              isHolding={isHolding}
              holdProgress={holdProgress}
              isComplete={isComplete}
            />
          }
        />
      </div>

      {/* ── NOME OGGETTO CON CLIP TESTO (altezza minima riservata per allineare le card in griglia) ── */}
      <div className="min-w-0 mb-1.5 text-center min-h-[34px] flex flex-col justify-start">
        <h4
          className="text-xs font-bold truncate leading-tight"
          title={displayName}
        >
          {displayName}
        </h4>
        {stashRequired !== undefined && stashRequired > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[10px] text-gray-400 font-mono">
            <span>{t('raid.stashProgress', { owned: stashOwned ?? 0, required: stashRequired })}</span>
            {(stashOwned ?? 0) < stashRequired && (stashOwned ?? 0) + raidItem.foundQuantity >= stashRequired && (
              <span className="text-[9px] font-sans font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                {t('raid.stashCoveredWithRaid')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── STEPPER NUMERICO IDENTICO ALLO STASH ── */}
      <QuantityStepper
        orientation="horizontal"
        tempValue={tempValue}
        onTempValueChange={setTempValue}
        onBlur={handleBlur}
        onIncrement={onIncrementFound}
        onDecrement={onDecrementFound}
        rarity={itemInfo?.rarity}
        itemName={displayName}
      />
    </div>
  );
};
