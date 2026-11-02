import { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import type { ItemInfo, RaidItem } from '@/types';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useTranslation, getItemName } from '@/i18n';

// ── PARAMETRI DI CONFIGURAZIONE INTERAZIONE (NON MAGIC NUMBERS) ──
export const RAID_HOLD_CONFIG = {
  /** Millisecondi iniziali di "zona morta" per ignorare tocchi accidentali o scroll */
  deadzoneMs: 200,
  /** Durata della pressione continua necessaria per completare l'oggetto (dopo la deadzone) */
  completeDurationMs: 1000,
  /** Durata della pressione continua necessaria per deselezionare l'oggetto (dopo la deadzone) */
  uncompleteDurationMs: 1400,
  /** Durata dell'effetto esplosione/glow post-completamento */
  burstDurationMs: 500,
} as const;

export type RaidItemCardProps = {
  raidItem: RaidItem;
  itemInfo?: ItemInfo;
  onIncrementFound: () => void;
  onDecrementFound: () => void;
  onSetFound: (val: number) => void;
  onComplete: () => void;
  onResetProgress: () => void;
  onOpenEditModal: () => void;
  onRemove: () => void;
  /** Se true, nasconde il pulsante di rimozione (Focus Mode attiva) */
  hideDelete?: boolean;
};

export const RaidItemCard = ({
  raidItem,
  itemInfo,
  onIncrementFound,
  onDecrementFound,
  onSetFound,
  onComplete,
  onResetProgress,
  onOpenEditModal,
  onRemove,
  hideDelete = false,
}: RaidItemCardProps) => {
  const { t, language } = useTranslation();
  const displayName = getItemName(itemInfo, language) || raidItem.itemId.replace(/-/g, ' ');

  // ── STATO COMPLETAMENTO ──
  // 0: nessun oggetto segnato (neutro)
  // > 0 ma < target: completamento parziale (giallo)
  // >= target: completamento totale (verde)
  const isComplete = raidItem.foundQuantity >= raidItem.targetQuantity;
  const isPartial = raidItem.foundQuantity > 0 && !isComplete;

  // ── BORDO ESTERNO CARD DINAMICO ──
  // Neutro se 0, Giallo se parziale, Verde se completo
  const cardBorderClass = isComplete
    ? 'border-emerald-500 shadow-sm shadow-emerald-500/20'
    : isPartial
    ? 'border-amber-400 dark:border-amber-500 shadow-sm shadow-amber-400/15'
    : 'border-gray-200 dark:border-gray-800';

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

  // ── PRESSIONE PROLUNGATA & TRANSIZIONE (HOLD-TO-ACTION) ──
  const [holdProgress, setHoldProgress] = useState(0); // 0 -> 1
  const [isHolding, setIsHolding] = useState(false);
  const [bursting, setBursting] = useState(false);

  const holdStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const targetDurationMs = isComplete
    ? RAID_HOLD_CONFIG.uncompleteDurationMs
    : RAID_HOLD_CONFIG.completeDurationMs;

  const cancelHold = useCallback(() => {
    setIsHolding(false);
    holdStartRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (bursting) return;
    setIsHolding(true);
    const startTime = performance.now();
    holdStartRef.current = startTime;

    const tick = (now: number) => {
      const elapsed = now - startTime;

      // Durante la zona morta non mostriamo ancora avanzamento
      if (elapsed < RAID_HOLD_CONFIG.deadzoneMs) {
        setHoldProgress(0);
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // Tempo attivo dopo la deadzone
      const activeElapsed = elapsed - RAID_HOLD_CONFIG.deadzoneMs;
      const progress = Math.min(1, activeElapsed / targetDurationMs);
      setHoldProgress(progress);

      if (progress >= 1) {
        // Raggiunto il 100%!
        setIsHolding(false);
        holdStartRef.current = null;
        setHoldProgress(0);

        // Effetto burst/esplosione
        setBursting(true);
        setTimeout(() => setBursting(false), RAID_HOLD_CONFIG.burstDurationMs);

        if (isComplete) {
          onResetProgress();
        } else {
          onComplete();
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [bursting, isComplete, targetDurationMs, onComplete, onResetProgress]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative flex flex-col p-2.5 rounded-[24px] card-concentric-24 squircle border-2 ${cardBorderClass} bg-white dark:bg-gray-900 transition-all select-none overflow-hidden ${
        isHolding && holdProgress > 0.1 ? 'animate-pulse' : ''
      } ${bursting ? 'scale-[1.03] ring-4 ring-emerald-400/50' : ''}`}
    >
      {/* ── BAGLIORE ESPLOSIONE FINALE (BURST) ── */}
      {bursting && (
        <div className="absolute inset-0 bg-emerald-400/25 dark:bg-emerald-400/35 z-30 pointer-events-none animate-ping rounded-[24px]" />
      )}

      {/* ── AREA ICONA OGGETTO (INTERATTIVA: PRESSIONE PROLUNGATA) ── */}
      <div
        className="relative cursor-pointer touch-none active:scale-[0.98] transition-transform"
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        title={
          isComplete
            ? 'Tieni premuto per azzerare'
            : 'Tieni premuto per completare'
        }
      >
        <ItemCardFrameV2
          icon={itemInfo?.icon}
          alt={displayName}
          rarity={itemInfo?.rarity}
          fallbackText={raidItem.itemId.replace(/-/g, ' ')}
          className="mb-1.5"
          imgClassName="max-w-full max-h-full object-contain"
          categoryBadge={
            <CategoryBadge
              itemType={itemInfo?.item_type}
              subcategory={itemInfo?.subcategory}
              bare
            />
          }
          barRightSlot={
            <span
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-black font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              ×{raidItem.targetQuantity}
            </span>
          }
          overlay={
            <>
              {/* Overlay stato completato statico */}
              {isComplete && !isHolding && (
                <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-white dark:bg-black/90 text-emerald-500 flex items-center justify-center shadow-lg border border-emerald-400">
                    <CheckCircle2 size={24} className="stroke-[2.5]" />
                  </div>
                </div>
              )}

              {/* Overlay animazione espansione dal centro (Hold to Complete / Reset) */}
              {isHolding && holdProgress > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-[20px]">
                  <div
                    style={{
                      transform: `scale(${holdProgress * 2.2})`,
                      opacity: Math.min(0.9, holdProgress + 0.1),
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isComplete ? 'bg-rose-500/80 text-white' : 'bg-emerald-500/80 text-white'
                    }`}
                  >
                    {isComplete ? (
                      <RotateCcw size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} className="stroke-[3]" />
                    )}
                  </div>
                </div>
              )}
            </>
          }
        />
      </div>

      {/* ── NOME OGGETTO CON CLIP TESTO ── */}
      <div className="min-w-0 mb-1.5 text-center">
        <h4
          className="text-xs font-bold truncate leading-tight"
          title={displayName}
        >
          {displayName}
        </h4>
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

      {/* ── BARRA INFERIORE: MODIFICA / ELIMINA ── */}
      {!hideDelete && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onOpenEditModal}
            className="p-1 text-gray-400 hover:text-blue-500 rounded-lg active:scale-90 transition-colors cursor-pointer"
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <span className="text-[10px] font-bold text-gray-400 hover:text-blue-500">Modifica</span>
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 rounded-lg active:scale-90 transition-colors cursor-pointer"
            title={t('common.delete')}
            aria-label={t('common.delete')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
