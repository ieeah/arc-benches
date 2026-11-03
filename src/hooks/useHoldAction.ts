import { useState, useRef, useEffect, useCallback, useMemo, type MouseEvent, type TouchEvent } from 'react';
import { useHoldConfig, type HoldConfig } from '@/lib/holdConfig';

export type UseHoldActionOptions = {
  isComplete: boolean;
  onComplete: () => void;
  onReset: () => void;
  onClick?: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  config?: Partial<HoldConfig>;
};

export type UseHoldActionResult = {
  isHolding: boolean;
  holdProgress: number; // 0 to 1
  bursting: boolean;
  holdProps: {
    onMouseDown: (e: MouseEvent) => void;
    onMouseUp: (e: MouseEvent) => void;
    onMouseLeave: (e: MouseEvent) => void;
    onTouchStart: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchCancel: (e: TouchEvent) => void;
    onClick: (e: MouseEvent) => void;
  };
};

export function useHoldAction({
  isComplete,
  onComplete,
  onReset,
  onClick,
  onHoldStart,
  onHoldEnd,
  config,
}: UseHoldActionOptions): UseHoldActionResult {
  const activeHoldConfig = useHoldConfig();
  const mergedConfig = useMemo(() => ({ ...activeHoldConfig, ...config }), [activeHoldConfig, config]);

  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [bursting, setBursting] = useState(false);

  const holdStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const didTriggerRef = useRef(false);
  const isPointerDownRef = useRef(false);

  const onHoldStartRef = useRef(onHoldStart);
  const onHoldEndRef = useRef(onHoldEnd);
  const onCompleteRef = useRef(onComplete);
  const onResetRef = useRef(onReset);

  useEffect(() => {
    onHoldStartRef.current = onHoldStart;
    onHoldEndRef.current = onHoldEnd;
    onCompleteRef.current = onComplete;
    onResetRef.current = onReset;
  }, [onHoldStart, onHoldEnd, onComplete, onReset]);

  const notifyHoldStart = useCallback(() => {
    if (!isPointerDownRef.current) {
      isPointerDownRef.current = true;
      onHoldStartRef.current?.();
    }
  }, []);

  const notifyHoldEnd = useCallback(() => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      onHoldEndRef.current?.();
    }
  }, []);

  const targetDurationMs = isComplete
    ? mergedConfig.uncompleteDurationMs
    : mergedConfig.completeDurationMs;

  const cancelHold = useCallback(() => {
    setIsHolding(false);
    holdStartRef.current = null;
    touchStartPosRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setHoldProgress(0);
    notifyHoldEnd();
  }, [notifyHoldEnd]);

  const startHold = useCallback((startX?: number, startY?: number) => {
    if (bursting) return;
    notifyHoldStart();
    didTriggerRef.current = false;
    setIsHolding(true);
    if (startX !== undefined && startY !== undefined) {
      touchStartPosRef.current = { x: startX, y: startY };
    }

    const startTime = performance.now();
    holdStartRef.current = startTime;

    const tick = (now: number) => {
      const elapsed = now - startTime;

      if (elapsed < mergedConfig.deadzoneMs) {
        setHoldProgress(0);
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const activeElapsed = elapsed - mergedConfig.deadzoneMs;
      const progress = Math.min(1, activeElapsed / targetDurationMs);
      setHoldProgress(progress);

      if (progress >= 1) {
        setIsHolding(false);
        holdStartRef.current = null;
        touchStartPosRef.current = null;
        setHoldProgress(0);
        didTriggerRef.current = true;

        setBursting(true);
        setTimeout(() => setBursting(false), mergedConfig.holdExit.feedbackMs);

        if (isComplete) {
          onResetRef.current();
        } else {
          onCompleteRef.current();
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [bursting, notifyHoldStart, isComplete, targetDurationMs, mergedConfig]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    startHold();
  }, [startHold]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    cancelHold();
  }, [cancelHold]);

  const handleMouseLeave = useCallback(() => {
    cancelHold();
  }, [cancelHold]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length > 1) {
      cancelHold();
      return;
    }
    const touch = e.touches[0];
    startHold(touch.clientX, touch.clientY);
  }, [startHold, cancelHold]);

  const handleTouchEnd = useCallback(() => {
    cancelHold();
  }, [cancelHold]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartPosRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    if (dx > mergedConfig.touchMoveThresholdPx || dy > mergedConfig.touchMoveThresholdPx) {
      cancelHold();
    }
  }, [cancelHold, mergedConfig.touchMoveThresholdPx]);

  const handleTouchCancel = useCallback(() => {
    cancelHold();
  }, [cancelHold]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (didTriggerRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didTriggerRef.current = false;
      return;
    }
    onClick?.();
  }, [onClick]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isHolding,
    holdProgress,
    bursting,
    holdProps: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchCancel: handleTouchCancel,
      onClick: handleClick,
    },
  };
}
