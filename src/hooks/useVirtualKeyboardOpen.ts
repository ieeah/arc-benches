import { useState, useEffect, useRef } from 'react';

const KEYBOARD_HEIGHT_THRESHOLD = 120;

function isTextInputElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    return !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color'].includes(type);
  }
  return (el as HTMLElement).isContentEditable;
}

export function useVirtualKeyboardOpen(): boolean {
  const [isOpen, setIsOpen] = useState(false);
  const baseHeightRef = useRef<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isCoarsePointer = () =>
      Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    const check = () => {
      const focused = isTextInputElement(document.activeElement);
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;

      if (!focused) {
        baseHeightRef.current = Math.max(baseHeightRef.current, window.innerHeight);
        setIsOpen(false);
        return;
      }

      const heightDiff = baseHeightRef.current - currentHeight;
      setIsOpen(heightDiff > KEYBOARD_HEIGHT_THRESHOLD || isCoarsePointer());
    };

    const handleFocusOut = () => {
      // Attendi il tick successivo perché document.activeElement può passare a body
      setTimeout(check, 50);
    };

    const vv = window.visualViewport;
    vv?.addEventListener('resize', check);
    window.addEventListener('resize', check);
    window.addEventListener('focusin', check);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      vv?.removeEventListener('resize', check);
      window.removeEventListener('resize', check);
      window.removeEventListener('focusin', check);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isOpen;
}
