/**
 * Client del cestino Dev (`GET/POST <base>__dev/trash`, vedi vite-plugins/dev-trash.ts): tiene ciò che
 * l'editor elimina in `dev-trash/trash.json`, file locale (ignorato da git) e mai incluso nella build.
 */
import type { List, ListType, PassTrackDef, Reward } from '@/types';

export interface DevTrashEntry {
  id: string;
  kind: string;
  label: string;
  deletedAt: string;
  payload: unknown;
}

export interface PassTrackTrashPayload {
  listId: string;
  track: PassTrackDef;
  /** Posizione che la traccia aveva nell'elenco, per rimetterla al suo posto. */
  trackIndex: number;
  rewards: { level: number; reward: Reward }[];
}

export interface ListTrashPayload {
  list: List;
}

/**
 * `true` se la lista eliminata è ancora nel file del suo tipo: l'eliminazione è solo una bozza e il file cambierà
 * quando si usa «Applica» (o lo si sovrascrive a mano).
 */
export function isListStillInFile(list: List, files: Partial<Record<ListType, List[]>>): boolean {
  return (files[list.listType] ?? []).some((l) => l.id === list.id);
}

export type TrashResult = { ok: true; entries: DevTrashEntry[] } | { ok: false; message: string };

const url = () => `${import.meta.env.BASE_URL}__dev/trash`;
const UNREACHABLE = 'Il cestino non è raggiungibile: serve il dev server in locale.';

async function request(init?: RequestInit): Promise<TrashResult> {
  try {
    const res = await fetch(url(), init);
    const body = (await res.json()) as { status: string; entries?: DevTrashEntry[]; message?: string };
    return body.status === 'ok' ? { ok: true, entries: body.entries ?? [] } : { ok: false, message: body.message ?? UNREACHABLE };
  } catch {
    return { ok: false, message: UNREACHABLE };
  }
}

const post = (body: unknown) =>
  request({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const listTrash = () => request();
export const addToTrash = (entry: DevTrashEntry) => post({ action: 'add', entry });
export const removeFromTrash = (id: string) => post({ action: 'remove', id });
export const clearAllTrash = () => post({ action: 'clear' });

export const isPassTrackEntry = (e: DevTrashEntry): e is DevTrashEntry & { payload: PassTrackTrashPayload } =>
  e.kind === 'pass-track' && typeof e.payload === 'object' && e.payload !== null && 'track' in e.payload && 'listId' in e.payload;

export const isListEntry = (e: DevTrashEntry): e is DevTrashEntry & { payload: ListTrashPayload } =>
  e.kind === 'list' && typeof e.payload === 'object' && e.payload !== null && 'list' in e.payload;
