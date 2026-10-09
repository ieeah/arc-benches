/**
 * Cestino degli strumenti Dev: `dev-trash/trash.json` nella radice del repository.
 * Tiene ciò che l'editor elimina (es. le tracce di un Reward Pass con le loro ricompense) per poterlo
 * recuperare. Il file è versionato ma sta fuori da `src/` e `public/` e non viene mai importato
 * dall'app: la build di produzione non lo contiene. Lo legge e lo scrive solo il dev server.
 */
import fs from 'node:fs';
import path from 'node:path';

export const TRASH_FILE = 'dev-trash/trash.json';

export interface TrashEntry {
  id: string;
  /** Tipo di contenuto eliminato, es. `pass-track`. */
  kind: string;
  /** Descrizione leggibile, mostrata nell'elenco del cestino. */
  label: string;
  /** Data di eliminazione, ISO 8601. */
  deletedAt: string;
  /** Dati sufficienti a ripristinare l'elemento: la forma dipende da `kind`. */
  payload: unknown;
}

const isEntry = (v: unknown): v is TrashEntry => {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === 'string' && e.id.length > 0 &&
    typeof e.kind === 'string' && e.kind.length > 0 &&
    typeof e.label === 'string' &&
    typeof e.deletedAt === 'string' &&
    'payload' in e
  );
};

export function readTrash(root: string): TrashEntry[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.resolve(root, TRASH_FILE), 'utf-8')) as { entries?: unknown };
    return Array.isArray(parsed.entries) ? parsed.entries.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function writeTrash(root: string, entries: TrashEntry[]): void {
  const file = path.resolve(root, TRASH_FILE);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify({ entries }, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmp, file);
}

/** Aggiunge una voce (la più recente per prima). Un id già presente viene sostituito. */
export function addTrashEntry(root: string, entry: unknown): { ok: true; entries: TrashEntry[] } | { ok: false; message: string } {
  if (!isEntry(entry)) return { ok: false, message: 'Voce del cestino non valida.' };
  const entries = [entry, ...readTrash(root).filter((e) => e.id !== entry.id)];
  writeTrash(root, entries);
  return { ok: true, entries };
}

/** Svuota il cestino (eliminazione definitiva di tutte le voci). */
export function clearTrash(root: string): { ok: true; entries: TrashEntry[] } {
  writeTrash(root, []);
  return { ok: true, entries: [] };
}

export function removeTrashEntry(root: string, id: unknown): { ok: true; entries: TrashEntry[] } | { ok: false; message: string } {
  if (typeof id !== 'string' || !id) return { ok: false, message: 'Id non valido.' };
  const entries = readTrash(root).filter((e) => e.id !== id);
  writeTrash(root, entries);
  return { ok: true, entries };
}
