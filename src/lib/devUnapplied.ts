import { getDevArtifacts } from '@/lib/devArtifacts';

let suppressed = false;

/** Da chiamare prima di un ricaricamento voluto (dopo «Applica» o uno scarto delle bozze): niente avviso. */
export const suppressUnappliedWarning = () => {
  suppressed = true;
};

/** `true` se almeno un file degli strumenti Dev ha modifiche in bozza non ancora scritte nel progetto. */
export function hasUnappliedChanges(): boolean {
  if (suppressed) return false;
  try {
    return getDevArtifacts().some((a) => a.isModified());
  } catch {
    return false;
  }
}

/** Nomi dei file con modifiche non applicate. */
export function unappliedFiles(): string[] {
  try {
    return getDevArtifacts().filter((a) => a.isModified()).map((a) => a.file.split('/').pop() ?? a.file);
  } catch {
    return [];
  }
}
