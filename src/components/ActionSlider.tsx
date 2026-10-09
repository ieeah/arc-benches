import { useState, useRef, type PointerEvent } from 'react';
import { Check, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n';
import type { ActionContext } from '@/types';
import { ActionContextChips } from '@/components/ActionContextChips';

interface ActionSliderProps extends ActionContext {
  label: string;
  listName?: string;
  level?: number;
  isCompleted?: boolean;
  onComplete: () => void;
  onToggle?: () => void;
  disabled?: boolean;
}

const THUMB_WIDTH = 44;
const ACTIVATION_THRESHOLD = 0.85;

/**
 * Swipe-to-complete slider: the thumb follows the finger 1:1 (linear, no deadzone or damping)
 * and the action completes when released past the activation threshold.
 */
export const ActionSlider = ({
  label,
  listName,
  level,
  isCompleted = false,
  onComplete,
  onToggle,
  disabled = false,
  maps,
  carryItems,
}: ActionSliderProps) => {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [justCompleted, setJustCompleted] = useState(false);
  const draggingRef = useRef(false);
  const startXRef = useRef<number>(0);
  const currentDragProgressRef = useRef<number>(0);

  const showCompletedState = isCompleted || justCompleted;

  const handleStart = (clientX: number) => {
    if (disabled || showCompletedState) return;
    draggingRef.current = true;
    setIsDragging(true);
    startXRef.current = clientX;
    currentDragProgressRef.current = 0;
    setProgress(0);
  };

  const handleMove = (clientX: number) => {
    if (!draggingRef.current || !trackRef.current) return;
    const maxTravel = Math.max(1, trackRef.current.clientWidth - THUMB_WIDTH);
    const visualP = Math.min(1, Math.max(0, (clientX - startXRef.current) / maxTravel));
    currentDragProgressRef.current = visualP;
    setProgress(visualP);
  };

  const handleEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    if (currentDragProgressRef.current >= ACTIVATION_THRESHOLD) {
      setProgress(1);
      setJustCompleted(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {
          // ignore
        }
      }
      setTimeout(() => {
        onComplete();
      }, 200);
    } else {
      // Snap back smoothly
      setProgress(0);
      currentDragProgressRef.current = 0;
    }
  };

  // Pointer events con cattura: il gesto resta del pollice anche se il dito esce dalla traccia o
  // devia in verticale (con i touch events il browser lo annullava e lo scorrimento si bloccava).
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleStart(e.clientX);
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || showCompletedState) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setJustCompleted(true);
      setProgress(1);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {
          // ignore
        }
      }
      setTimeout(() => {
        onComplete();
      }, 200);
    }
  };

  if (isCompleted && !justCompleted) {
    return (
      <div className="w-full bg-green-50/60 dark:bg-green-950/20 border border-green-200/80 dark:border-green-800/40 rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {listName && (
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                {listName}
              </span>
            )}
            {level !== undefined && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-300 px-1.5 py-0.5 rounded-full shrink-0">
                Lvl {level}
              </span>
            )}
          </div>
          <span className="text-[10px] text-green-600 dark:text-green-400 shrink-0 font-semibold flex items-center gap-1">
            <Check size={12} strokeWidth={3} /> {t('stash.actionCompleted')}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight line-through">
            {label}
          </p>
          <button
            type="button"
            onClick={() => (onToggle ? onToggle() : onComplete())}
            className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-lg shrink-0 transition-colors shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} />
            {t('stash.reopenAction')}
          </button>
        </div>
      </div>
    );
  }

  // Posizione del pollice in CSS (percentuale della traccia): nessuna misura letta durante il render
  const thumbOffset = `calc((100% - ${THUMB_WIDTH}px) * ${progress})`;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 shadow-xs space-y-2">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {listName && (
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
              {listName}
            </span>
          )}
          {level !== undefined && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full shrink-0">
              Lvl {level}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 font-medium">
          {showCompletedState ? t('stash.actionCompleted') : t('stash.slideActionToComplete')}
        </span>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-tight">
        {label}
      </p>
      <ActionContextChips maps={maps} carryItems={carryItems} />

      {/* Swipe Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={`${label} (${listName ?? ''})`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => handleMove(e.clientX)}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
        className={cn(
          'relative h-11 w-full rounded-xl select-none overflow-hidden touch-none flex items-center',
          'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 cursor-grab active:cursor-grabbing',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        {/* Fill background following progress */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-xl transition-colors',
            showCompletedState || progress >= ACTIVATION_THRESHOLD
              ? 'bg-green-500/20 dark:bg-green-500/30'
              : 'bg-blue-500/15 dark:bg-blue-500/20',
          )}
          style={{
            // fino al centro del pollice: il bordo destro resta nascosto sotto di esso
            width: `calc((100% - ${THUMB_WIDTH}px) * ${progress} + ${THUMB_WIDTH / 2}px)`,
            transition: isDragging ? 'none' : 'width 260ms cubic-bezier(0.2, 0.9, 0.3, 1)',
          }}
        />

        {/* Shimmer label inside track */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none px-12 transition-opacity"
          style={{ opacity: Math.max(0, 1 - progress * 1.5) }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
            {t('stash.slideActionToComplete')} <ChevronRight size={13} className="animate-pulse" />
          </span>
        </div>

        {/* Thumb */}
        <div
          style={{
            left: thumbOffset,
            transition: isDragging ? 'none' : 'left 260ms cubic-bezier(0.2, 0.9, 0.3, 1)',
          }}
          className={cn(
            'absolute top-0 bottom-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors shadow-sm',
            showCompletedState || progress >= ACTIVATION_THRESHOLD
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600',
          )}
        >
          {showCompletedState || progress >= ACTIVATION_THRESHOLD ? (
            <Check size={18} strokeWidth={3} className="animate-in zoom-in-75 duration-150" />
          ) : (
            <ChevronRight size={18} className="text-blue-500 dark:text-blue-400" />
          )}
        </div>
      </div>
    </div>
  );
};
