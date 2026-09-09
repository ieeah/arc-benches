import { useEffect, useRef } from 'react';

const INPUT_SELECTOR =
  'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stack of mounted dialogs: only the topmost responds to Esc / traps Tab, so nested
// dialogs (e.g. CustomListEditor → ItemPicker) close one layer at a time.
const stack: symbol[] = [];

/**
 * Accessibility plumbing for modal dialogs: moves focus automatically to the first input
 * (or first focusable element) on open, traps Tab navigation, closes on Esc, and restores focus
 * to the trigger on unmount. Attach the returned ref to the dialog panel.
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

    // Move focus inside dialog on open (prioritize first text input / form field, else first focusable)
    const focusTimer = setTimeout(() => {
      if (!panel) return;
      if (!panel.contains(document.activeElement)) {
        const firstInput = panel.querySelector<HTMLElement>(INPUT_SELECTOR);
        if (firstInput) {
          firstInput.focus();
          if (firstInput instanceof HTMLInputElement && (firstInput.type === 'text' || firstInput.type === 'number')) {
            firstInput.select?.();
          }
          return;
        }
        const first = panel.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? panel).focus();
      }
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return; // only the topmost dialog reacts
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          el => !el.hasAttribute('disabled') && (el.offsetParent !== null || el.getClientRects().length > 0)
        );
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
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown, true);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      previouslyFocused?.focus?.();
    };
  }, []);

  return panelRef;
}
