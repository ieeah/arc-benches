import { useEffect } from 'react';
import { hasUnappliedChanges } from '@/lib/devUnapplied';

/**
 * Chiede conferma prima di chiudere la scheda o ricaricare la pagina mentre ci sono modifiche degli strumenti Dev
 * non ancora applicate ai file del progetto (il file e la bozza non coincidono).
 */
export function useUnappliedChangesWarning(): void {
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnappliedChanges()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);
}
