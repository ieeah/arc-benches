import { useState, useRef, useCallback, useEffect, type TouchEvent, type MouseEvent } from 'react';
import { Check, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n';

interface ActionSliderProps {
  label: string;
  listName?: string;
  level?: number;
  isCompleted?: boolean;
  onComplete: () => void;
  onToggle?: () => void;
  disabled?: boolean;
}

/**
 * ActionSlider with asymmetric resistance, initial deadzone, and elastic drag to complete.
 * Prevents accidental taps while providing tactile swipe feedback.
 */
export const ActionSlider = ({
  label,
  listName,
  level,
  isCompleted = false,
  onComplete,
  onToggle,
  disabled = false,
}: ActionSliderProps) => {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [justCompleted, setJustCompleted] = useState(false);
  const startXRef = useRef<number>(0);
  const currentDragProgressRef = useRef<number>(0);

  // Compute visual progress from raw gesture delta ratio (r from 0 to >1)
  const computeVisualProgress = (r: number): number => {
    if (r <= 0.15) {
      return 0; // 0 - 15% Deadzone
    }
    if (r <= 0.75) {
      // 15% - 75% Linear 1:1 feel
      return ((r - 0.15) / 0.6) * 0.75;
    }
    // 75% - 100% Elastic resistance damping
    const overflow = r - 0.75;
    const damped = 0.75 + 0.25 * (1 - Math.exp(-overflow / 0.35));
    return Math.min(1, damped);
  };

  const showCompletedState = isCompleted || justCompleted;

  const handleStart = (clientX: number) => {
    if (disabled || showCompletedState) return;
    setIsDragging(true);
    startXRef.current = clientX;
    currentDragProgressRef.current = 0;
    setProgress(0);
  };

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !trackRef.current) return;
    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = 44;
    const maxTravel = Math.max(1, trackWidth - thumbWidth);

    const deltaX = clientX - startXRef.current;
    const rawRatio = Math.max(0, deltaX / maxTravel);
    const visualP = computeVisualProgress(rawRatio);

    currentDragProgressRef.current = visualP;
    setProgress(visualP);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // 85% activation threshold
    if (currentDragProgressRef.current >= 0.85) {
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
  }, [isDragging, onComplete]);

  // Touch handlers
  const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Global mouse handlers when dragging
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: globalThis.MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

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

  const thumbTranslateX = trackRef.current
    ? progress * Math.max(0, trackRef.current.clientWidth - 44)
    : progress * 200;

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
        onMouseDown={(e: MouseEvent) => handleStart(e.clientX)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        className={cn(
          'relative h-11 w-full rounded-xl select-none overflow-hidden touch-pan-y flex items-center',
          'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 cursor-grab active:cursor-grabbing',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        {/* Fill background following progress */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-colors',
            showCompletedState || progress >= 0.85
              ? 'bg-green-500/20 dark:bg-green-500/30'
              : 'bg-blue-500/15 dark:bg-blue-500/20',
          )}
          style={{
            width: `${Math.max(44, thumbTranslateX + 44)}px`,
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
            transform: `translateX(${thumbTranslateX}px)`,
            transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)',
          }}
          className={cn(
            'absolute left-0 top-0 bottom-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors shadow-sm',
            showCompletedState || progress >= 0.85
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600',
          )}
        >
          {showCompletedState || progress >= 0.85 ? (
            <Check size={18} strokeWidth={3} className="animate-in zoom-in-75 duration-150" />
          ) : (
            <ChevronRight size={18} className="text-blue-500 dark:text-blue-400" />
          )}
        </div>
      </div>
    </div>
  );
};
