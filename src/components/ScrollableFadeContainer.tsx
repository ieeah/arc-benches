import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  type ScrollableBleedType,
  type ScrollDimensions,
  type ScrollStateResult,
  computeScrollableState,
  computeFadeMask,
} from '@/lib/scrollableFade';

export type { ScrollableBleedType, ScrollDimensions, ScrollStateResult };

export type ScrollableFadeContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  bleedType?: ScrollableBleedType;
  fadeWidth?: number; // Ampiezza dissolvenza in px (default 24)
  wrapperClassName?: string;
  containerClassName?: string;
  ariaLabel?: string;
  role?: string;
  /** Disabilita il drag-to-scroll con mouse su desktop se non necessario */
  disableMouseDrag?: boolean;
};

/**
 * Contenitore orizzontale scorrevole con affordance visiva elegante e accessibile.
 * Rispetta le Modern Web Guidance:
 * - Gradient mask sui bordi (sinistro/destro) visualizzata solo se c'è effettivamente contenuto scorrevole.
 * - Non copre nè tronca il focus ring dei controlli interni quando navigati da tastiera (Tab).
 * - Touch-first: non interferisce con lo scrolling inerziale nativo su smartphone (-webkit-overflow-scrolling: touch).
 * - Mouse drag-to-scroll fluido su desktop con distinzione tra drag e click.
 */
export const ScrollableFadeContainer = ({
  children,
  bleedType = 'full',
  fadeWidth = 24,
  wrapperClassName = '',
  containerClassName = '',
  ariaLabel,
  role = 'region',
  disableMouseDrag = false,
  ...props
}: ScrollableFadeContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollStateResult>({
    isScrollable: false,
    showLeftFade: false,
    showRightFade: false,
  });
  const rafId = useRef<number | null>(null);

  // Tracciamento del drag tramite mouse per desktop
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const nextState = computeScrollableState({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    });

    setScrollState(prev => {
      if (
        prev.isScrollable === nextState.isScrollable &&
        prev.showLeftFade === nextState.showLeftFade &&
        prev.showRightFade === nextState.showRightFade
      ) {
        return prev;
      }
      return nextState;
    });
  }, []);

  const handleScroll = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(updateScrollState);
  };

  // ResizeObserver + passive resize listener per ricalcolo istantaneo
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();

    const observer = new ResizeObserver(() => {
      updateScrollState();
    });

    observer.observe(el);
    // Osserva anche i figli per intercettare variazioni dinamiche di contenuto
    Array.from(el.children).forEach(child => observer.observe(child));

    const handleWindowResize = () => updateScrollState();
    window.addEventListener('resize', handleWindowResize, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [children, updateScrollState]);

  // Gestione Focus da tastiera (Tab/Shift+Tab):
  // Quando un controllo figlio riceve il focus, facciamo scroll automatico
  // per portarlo fuori dalla zona di dissolvenza (fadeWidth + 8px),
  // assicurando che il focus-visible ring non sia coperto o tagliato.
  const handleFocusCapture = (e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const container = containerRef.current;
    if (!container || !target || target === container) return;

    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const safeMargin = fadeWidth + 8;

      if (targetRect.left < containerRect.left + safeMargin) {
        const offset = targetRect.left - (containerRect.left + safeMargin);
        container.scrollBy({ left: offset, behavior: 'smooth' });
      } else if (targetRect.right > containerRect.right - safeMargin) {
        const offset = targetRect.right - (containerRect.right - safeMargin);
        container.scrollBy({ left: offset, behavior: 'smooth' });
      }
    });
  };

  // Mouse Drag-to-Scroll per desktop (senza conflitti con i click)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disableMouseDrag || e.button !== 0) return;
    const el = containerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartXRef.current = e.pageX - el.offsetLeft;
    dragScrollLeftRef.current = el.scrollLeft;
    el.style.scrollBehavior = 'auto';

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const x = moveEvt.pageX - el.offsetLeft;
      const walk = (x - dragStartXRef.current) * 1.5;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      el.scrollLeft = dragScrollLeftRef.current - walk;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      el.style.scrollBehavior = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Se c'è stato trascinamento effettivo, blocca il click involontario sul bottone rilasciato
      if (hasMovedRef.current) {
        const captureClick = (clickEvt: MouseEvent) => {
          clickEvt.stopPropagation();
          clickEvt.preventDefault();
          window.removeEventListener('click', captureClick, true);
        };
        window.addEventListener('click', captureClick, true);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Gradient mask dinamica: maschera solo verso i lati in cui c'è contenuto eccedente
  const maskStyle = useMemo<React.CSSProperties>(() => {
    return computeFadeMask({
      isScrollable: scrollState.isScrollable,
      showLeftFade: scrollState.showLeftFade,
      showRightFade: scrollState.showRightFade,
      fadeWidth,
    });
  }, [scrollState, fadeWidth]);

  // Wrapper layout in base a bleedType
  let defaultWrapperClass = 'relative overflow-hidden';
  if (bleedType === 'full') {
    defaultWrapperClass = 'relative -mx-6 overflow-hidden';
  } else if (bleedType === 'left-only') {
    defaultWrapperClass = 'relative flex-1 min-w-0 overflow-hidden -ml-6';
  } else if (bleedType === 'none') {
    defaultWrapperClass = 'relative w-full overflow-hidden';
  }

  // Container interno con paddings per compensare i bleed e padding verticale (py-1) per il focus ring
  let defaultContainerPadding = 'py-1';
  if (bleedType === 'full') {
    defaultContainerPadding = 'px-6 py-1';
  } else if (bleedType === 'left-only') {
    defaultContainerPadding = 'pl-6 pr-4 py-1';
  }

  return (
    <div className={`${defaultWrapperClass} ${wrapperClassName}`.trim()}>
      <div
        ref={containerRef}
        role={role}
        aria-label={ariaLabel}
        onScroll={handleScroll}
        onFocusCapture={handleFocusCapture}
        onMouseDown={handleMouseDown}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          ...maskStyle,
        }}
        className={`flex items-center overflow-x-auto scrollbar-none overscroll-contain touch-pan-x select-none ${defaultContainerPadding} ${
          scrollState.isScrollable && !disableMouseDrag ? 'cursor-grab active:cursor-grabbing' : ''
        } ${containerClassName}`.trim()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};
