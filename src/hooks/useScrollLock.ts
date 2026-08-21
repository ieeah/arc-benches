import { useEffect } from 'react';
import { registerOverlay } from '@/hooks/useOverlayCount';

let lockCount = 0;
let savedStyles: {
  bodyOverflow: string;
  htmlOverflow: string;
  bodyOverscroll: string;
  bodyPaddingRight: string;
} | null = null;

function applyLock() {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    savedStyles = {
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverscroll: document.body.style.overscrollBehavior,
      bodyPaddingRight: document.body.style.paddingRight,
    };

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
  }
  lockCount++;
}

function releaseLock() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && savedStyles) {
    document.documentElement.style.overflow = savedStyles.htmlOverflow;
    document.body.style.overflow = savedStyles.bodyOverflow;
    document.body.style.overscrollBehavior = savedStyles.bodyOverscroll;
    document.body.style.paddingRight = savedStyles.bodyPaddingRight;
    savedStyles = null;
  }
}

/** Locks body and html scrolling while the calling component is mounted or when enabled (use in modals/drawers). */
export function useScrollLock(enabled: boolean = true, registerAsOverlay: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const unregister = registerAsOverlay ? registerOverlay() : undefined;
    applyLock();

    return () => {
      releaseLock();
      unregister?.();
    };
  }, [enabled, registerAsOverlay]);
}

