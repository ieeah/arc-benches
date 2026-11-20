import { useState, useEffect } from 'react';

const KEYBOARD_HEIGHT_THRESHOLD = 140;

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      const vv = window.visualViewport;
      const focused = isTextInputElement(document.activeElement);
      if (vv) {
        const diff = window.innerHeight - vv.height;
        setIsOpen(focused && diff > KEYBOARD_HEIGHT_THRESHOLD);
      } else {
        setIsOpen(false);
      }
    };

    const vv = window.visualViewport;
    vv?.addEventListener('resize', check);
    window.addEventListener('focusin', check);
    window.addEventListener('focusout', check);
    return () => {
      vv?.removeEventListener('resize', check);
      window.removeEventListener('focusin', check);
      window.removeEventListener('focusout', check);
    };
  }, []);

  return isOpen;
}
