import { useEffect } from 'react';

/** Locks body scrolling while the calling component is mounted (use in modals/drawers). */
export function useScrollLock() {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);
}
