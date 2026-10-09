/**
 * Ripristino dal cestino Dev nei dati di lavoro (la bozza delle liste in localStorage), da cui
 * «Applica al file» scrive poi il file di riferimento (`src/data/<tipo>.json`). Le funzioni `restore*`
 * sono pure; `restoreEntryToDraft` le applica alla bozza e la salva.
 */
import type { List, ListType } from '@/types';
import { isPass } from '@/lib/lists';
import { DRAFT_STORAGE_KEY, getInitialData, type ListsDataMap } from '@/hooks/dev/useDevListDrafts';
import {
  isListEntry,
  isPassTrackEntry,
  type DevTrashEntry,
  type PassTrackTrashPayload,
} from '@/lib/devTrash';

export type RestoreResult =
  | { ok: true; data: ListsDataMap; bucket: ListType }
  | { ok: false; message: string };

const allLists = (data: ListsDataMap): List[] => Object.values(data).flatMap((lists) => lists ?? []);

/** Rimette una lista eliminata nel suo gruppo; rifiutato se l'id è già usato da un'altra lista. */
export function restoreList(data: ListsDataMap, list: List): RestoreResult {
  if (allLists(data).some((l) => l.id === list.id)) {
    return { ok: false, message: `Esiste già una lista con id «${list.id}»: rinominala o eliminala prima di ripristinare.` };
  }
  const bucket = list.listType;
  return { ok: true, bucket, data: { ...data, [bucket]: [...(data[bucket] ?? []), list] } };
}

/** Rimette una traccia rimossa, al suo posto, con le ricompense ai livelli di origine. */
export function restorePassTrack(data: ListsDataMap, payload: PassTrackTrashPayload): RestoreResult {
  const pass = (data.pass ?? []).find((l) => l.id === payload.listId);
  if (!pass || !isPass(pass)) {
    return { ok: false, message: `Il pass «${payload.listId}» non esiste più: ripristina prima il pass (se è nel cestino) o ricrealo.` };
  }
  if (pass.tracks.some((t) => t.id === payload.track.id)) {
    return { ok: false, message: `Il pass ha già una traccia «${payload.track.id}»: rinominala o rimuovila prima di ripristinare.` };
  }

  const tracks = [...pass.tracks];
  tracks.splice(Math.min(Math.max(payload.trackIndex, 0), tracks.length), 0, payload.track);
  const levels = pass.levels.map((lvl) => {
    const back = payload.rewards.filter((r) => r.level === lvl.level).map((r) => ({ ...r.reward, track: payload.track.id }));
    return back.length > 0 ? { ...lvl, rewards: [...(lvl.rewards ?? []), ...back] } : lvl;
  });
  const restored = { ...pass, tracks, levels };
  return {
    ok: true,
    bucket: 'pass',
    data: { ...data, pass: data.pass.map((l) => (l.id === pass.id ? restored : l)) },
  };
}

/** Il file che «Applica al file» riscrive per questo gruppo, o `null` se non ne ha uno (liste personalizzate). */
export function artifactIdForBucket(bucket: ListType): string | null {
  return bucket === 'custom' ? null : `lists-${bucket}`;
}

export function restoreEntry(data: ListsDataMap, entry: DevTrashEntry): RestoreResult {
  if (isListEntry(entry)) return restoreList(data, entry.payload.list);
  if (isPassTrackEntry(entry)) return restorePassTrack(data, entry.payload);
  return { ok: false, message: `Tipo di voce non ripristinabile: ${entry.kind}.` };
}

/** Dati di lavoro correnti: la bozza se esiste, altrimenti i file inclusi nell'app. */
export function readDraftData(): ListsDataMap {
  const initial = getInitialData();
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ListsDataMap>;
      return {
        workbench: parsed.workbench ?? initial.workbench,
        expedition: parsed.expedition ?? initial.expedition,
        project: parsed.project ?? initial.project,
        quest: parsed.quest ?? initial.quest,
        pass: parsed.pass ?? initial.pass,
        custom: parsed.custom ?? [],
      };
    }
  } catch { /* bozza illeggibile: si riparte dai file */ }
  return initial;
}

/** Applica il ripristino alla bozza salvata in localStorage (in modo sincrono, per poterla scrivere subito dopo). */
export function restoreEntryToDraft(entry: DevTrashEntry): RestoreResult {
  const result = restoreEntry(readDraftData(), entry);
  if (!result.ok) return result;
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(result.data));
  } catch {
    return { ok: false, message: 'Impossibile salvare la bozza (spazio del browser esaurito?).' };
  }
  return result;
}
