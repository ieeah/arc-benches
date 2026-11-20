import { useState, useEffect } from 'react';

/**
 * Restituisce `true` solo su dispositivi con puntatore preciso (desktop/mouse),
 * evitando di aprire automaticamente la tastiera virtuale su dispositivi touch.
 */
export function useDesktopAutoFocus(): boolean {
  const [isDesktopPointer, setIsDesktopPointer] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(pointer: fine)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: fine)');
    const handleChange = (e: MediaQueryListEvent) => setIsDesktopPointer(e.matches);
    setIsDesktopPointer(mq.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return isDesktopPointer;
}
