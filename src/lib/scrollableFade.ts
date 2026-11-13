export type ScrollableBleedType = 'full' | 'left-only' | 'none';

export type ScrollDimensions = {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
};

export type ScrollStateResult = {
  isScrollable: boolean;
  showLeftFade: boolean;
  showRightFade: boolean;
};

/**
 * Calcola lo stato di scorrimento orizzontale e l'esigenza di affordance visiva
 * con tolleranza sub-pixel di default a 2px.
 */
export function computeScrollableState(
  dimensions: ScrollDimensions,
  threshold = 2,
): ScrollStateResult {
  const { scrollLeft, scrollWidth, clientWidth } = dimensions;
  const isScrollable = scrollWidth > clientWidth + 1;
  const showLeftFade = isScrollable && scrollLeft > threshold;
  const showRightFade = isScrollable && scrollLeft < scrollWidth - clientWidth - threshold;
  return { isScrollable, showLeftFade, showRightFade };
}

/**
 * Genera la maschera CSS dinamica (linear-gradient) per la dissolvenza laterale.
 * Ritorna un oggetto vuoto se non c'è overflow o se non serve alcuna dissolvenza.
 */
export function computeFadeMask(params: {
  isScrollable: boolean;
  showLeftFade: boolean;
  showRightFade: boolean;
  fadeWidth?: number;
}): React.CSSProperties {
  const { isScrollable, showLeftFade, showRightFade, fadeWidth = 24 } = params;
  if (!isScrollable || (!showLeftFade && !showRightFade)) {
    return {};
  }

  const leftStop = showLeftFade
    ? `transparent 0px, black ${fadeWidth}px`
    : 'black 0px';
  const rightStop = showRightFade
    ? `black calc(100% - ${fadeWidth}px), transparent 100%`
    : 'black 100%';

  const mask = `linear-gradient(to right, ${leftStop}, ${rightStop})`;

  return {
    maskImage: mask,
    WebkitMaskImage: mask,
  };
}
