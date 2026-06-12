import { useEffect, useRef, useState } from 'react';

/** Repeats `callback` every `ms` while the element is held down (mouse or touch). */
export function useLongPress(callback: () => void, ms = 100) {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) { timer.current = setInterval(callback, ms); }
    else if (timer.current) { clearInterval(timer.current); }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [active, callback, ms]);

  return {
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    onMouseLeave: () => setActive(false),
    onTouchStart: () => setActive(true),
    onTouchEnd: () => setActive(false),
  };
}
