import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stack of mounted dialogs: only the topmost responds to Esc / traps Tab, so nested
// dialogs (e.g. CustomListEditor → ItemPicker) close one layer at a time.
const stack: symbol[] = [];

/**
 * Accessibility plumbing for modal dialogs: moves focus inside on open (unless the content
 * already auto-focused something), traps Tab, closes on Esc, and restores focus to the trigger
 * on unmount. Attach the returned ref to the dialog panel and set role="dialog" aria-modal.
 */
export function useDialog(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const id = Symbol('dialog');
    stack.push(id);
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Respect content that already auto-focused (e.g. search/name inputs).
    if (panel && !panel.contains(document.activeElement)) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return; // only the topmost dialog reacts
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) { e.preventDefault(); return; }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !panel.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      previouslyFocused?.focus?.();
    };
  }, []);

  return panelRef;
}
