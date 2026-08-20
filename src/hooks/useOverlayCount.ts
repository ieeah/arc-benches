import { useSyncExternalStore } from 'react';

let overlayCount = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(l => l());
}

export function registerOverlay(): () => void {
  overlayCount++;
  notify();
  return () => {
    overlayCount = Math.max(0, overlayCount - 1);
    notify();
  };
}

/**
 * Reattivo: restituisce true quando c'è almeno un Drawer o Modal/Overlay aperto nell'app.
 */
export function useIsOverlayOpen(): boolean {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
    () => overlayCount > 0
  );
}
