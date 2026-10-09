/**
 * Le bozze degli strumenti Dev contengono SOLO ciò che differisce dai file del repository.
 *
 * Salvare una copia completa a ogni visita lasciava nel browser fotografie dei file: quando poi un file
 * cambiava (git pull, script dati, un altro strumento) la bozza «vecchia» risultava modificata, nascondeva i dati
 * nuovi e «Applica» li sovrascriveva con quelli vecchi.
 */

/** Gruppi di `current` il cui contenuto differisce da `initial` (confronto per valore). */
export function pickChangedBuckets<T extends Record<string, unknown>>(current: T, initial: Partial<T>): Partial<T> {
  const changed: Partial<T> = {};
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (JSON.stringify(current[key]) !== JSON.stringify(initial[key] ?? [])) changed[key] = current[key];
  }
  return changed;
}

/** Salva `draft` in localStorage solo se non è vuota; se lo è (nessuna differenza) toglie la chiave. */
export function persistDraftOrClear(key: string, draft: Record<string, unknown> | null): void {
  try {
    if (draft && Object.keys(draft).length > 0) localStorage.setItem(key, JSON.stringify(draft));
    else localStorage.removeItem(key);
  } catch { /* storage non disponibile o quota esaurita */ }
}
