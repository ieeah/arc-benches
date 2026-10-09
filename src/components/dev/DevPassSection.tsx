import { useCallback, useEffect, useState } from 'react';
import { ArchiveRestore, Plus, Ticket, Trash2, X } from 'lucide-react';
import type { List, PassList } from '@/types';
import { isPass } from '@/lib/lists';
import { isValidItemId } from '@/lib/customItems';
import { generateUUID } from '@/lib/uuid';
import {
  addToTrash,
  isPassTrackEntry,
  listTrash,
  removeFromTrash,
  type DevTrashEntry,
  type PassTrackTrashPayload,
} from '@/lib/devTrash';

interface DevPassSectionProps {
  selectedList: PassList;
  updateSelectedList: (updater: (prev: List) => List) => void;
}

const inputClass =
  'w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500';

/**
 * Impostazioni di un Reward Pass nell'editor Dev: costo del premium e tracce (free, premium, legacy…).
 * Le tracce sono dati: ogni ricompensa dei livelli porta l'id della propria.
 */
export const DevPassSection = ({ selectedList, updateSelectedList }: DevPassSectionProps) => {
  const [newTrackId, setNewTrackId] = useState('');
  const [trash, setTrash] = useState<DevTrashEntry[]>([]);
  const [trashMessage, setTrashMessage] = useState('');

  const refreshTrash = useCallback(async () => {
    const result = await listTrash();
    if (result.ok) setTrash(result.entries);
    else setTrashMessage(result.message);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale dal dev server
    void refreshTrash();
  }, [refreshTrash]);
  const updatePass = (fn: (prev: PassList) => PassList) =>
    updateSelectedList((prev) => (isPass(prev) ? fn(prev) : prev));

  const idError = !newTrackId
    ? ''
    : !isValidItemId(newTrackId)
      ? 'Usa hyphen-case (es. legacy).'
      : selectedList.tracks.some((t) => t.id === newTrackId)
        ? 'Esiste già una traccia con questo id.'
        : '';

  const patchTrack = (id: string, patch: { name?: string; nameIt?: string; locked?: boolean }) =>
    updatePass((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t };
        if (patch.name !== undefined) next.name = patch.name;
        if (patch.locked !== undefined) {
          if (patch.locked) next.locked = true;
          else delete next.locked;
        }
        if (patch.nameIt !== undefined) {
          if (patch.nameIt) next.translations = { ...t.translations, it: { name: patch.nameIt } };
          else delete next.translations;
        }
        return next;
      }),
    }));

  const addTrack = () => {
    if (!newTrackId || idError) return;
    updatePass((prev) => ({ ...prev, tracks: [...prev.tracks, { id: newTrackId, name: newTrackId }] }));
    setNewTrackId('');
  };

  // Rimuovere una traccia toglie anche le sue ricompense: prima finiscono nel cestino (dev-trash/trash.json),
  // così si possono recuperare. Se il cestino non è raggiungibile, la traccia non viene rimossa.
  const removeTrack = async (id: string) => {
    const track = selectedList.tracks.find((t) => t.id === id);
    if (!track) return;
    const rewards = selectedList.levels.flatMap((lvl) =>
      (lvl.rewards ?? []).filter((r) => r.track === id).map((reward) => ({ level: lvl.level, reward })),
    );
    const payload: PassTrackTrashPayload = {
      listId: selectedList.id,
      track,
      trackIndex: selectedList.tracks.findIndex((t) => t.id === id),
      rewards,
    };
    const saved = await addToTrash({
      id: generateUUID(),
      kind: 'pass-track',
      label: `${selectedList.name}: traccia «${track.name}» (${rewards.length} ricompense)`,
      deletedAt: new Date().toISOString(),
      payload,
    });
    if (!saved.ok) {
      setTrashMessage(saved.message);
      return;
    }
    setTrash(saved.entries);
    setTrashMessage('');
    updatePass((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((t) => t.id !== id),
      levels: prev.levels.map((lvl) => {
        if (!lvl.rewards) return lvl;
        const kept = lvl.rewards.filter((r) => r.track !== id);
        const { rewards: _old, ...rest } = lvl;
        void _old;
        return kept.length > 0 ? { ...rest, rewards: kept } : rest;
      }),
    }));
  };

  const restoreTrack = async (entry: DevTrashEntry & { payload: PassTrackTrashPayload }) => {
    const { track, trackIndex, rewards } = entry.payload;
    if (selectedList.tracks.some((t) => t.id === track.id)) {
      setTrashMessage(`Esiste già una traccia «${track.id}»: rinominala o rimuovila prima di ripristinare.`);
      return;
    }
    updatePass((prev) => {
      const tracks = [...prev.tracks];
      tracks.splice(Math.min(Math.max(trackIndex, 0), tracks.length), 0, track);
      const levels = prev.levels.map((lvl) => {
        const back = rewards.filter((r) => r.level === lvl.level).map((r) => ({ ...r.reward, track: track.id }));
        return back.length > 0 ? { ...lvl, rewards: [...(lvl.rewards ?? []), ...back] } : lvl;
      });
      return { ...prev, tracks, levels };
    });
    const removed = await removeFromTrash(entry.id);
    if (removed.ok) {
      setTrash(removed.entries);
      setTrashMessage('');
    } else setTrashMessage(removed.message);
  };

  const purge = async (id: string) => {
    const removed = await removeFromTrash(id);
    if (removed.ok) {
      setTrash(removed.entries);
      setTrashMessage('');
    } else setTrashMessage(removed.message);
  };

  const passTrash = trash.filter(isPassTrackEntry).filter((e) => e.payload.listId === selectedList.id);

  const firstTrackId = selectedList.tracks[0]?.id;
  const rewardCount = (trackId: string) =>
    selectedList.levels.reduce(
      (n, lvl) => n + (lvl.rewards?.filter((r) => (r.track ?? firstTrackId) === trackId).length ?? 0),
      0,
    );

  return (
    <div className="sm:col-span-2 space-y-3 p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
        <Ticket size={14} /> Reward Pass
      </h3>

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
          Costo traccia premium (Raider Token, informativo)
        </span>
        <input
          type="number"
          min={0}
          value={selectedList.premiumCostTokens ?? ''}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            updatePass((prev) => {
              const next = { ...prev };
              if (Number.isFinite(value) && value >= 0) next.premiumCostTokens = value;
              else delete next.premiumCostTokens;
              return next;
            });
          }}
          className={inputClass}
        />
      </label>

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
          Tracce ({selectedList.tracks.length}), nell'ordine di visualizzazione
        </span>
        {selectedList.tracks.map((track) => (
          <div
            key={track.id}
            className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end p-2 bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl"
          >
            <label className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-mono text-gray-400 truncate block">
                {track.id} · {rewardCount(track.id)} ricompense
              </span>
              <input
                value={track.name}
                onChange={(e) => patchTrack(track.id, { name: e.target.value })}
                placeholder="Nome (EN)"
                className={inputClass}
              />
            </label>
            <label className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase">IT</span>
              <input
                value={track.translations?.it?.name ?? ''}
                onChange={(e) => patchTrack(track.id, { nameIt: e.target.value })}
                placeholder={track.name}
                className={inputClass}
              />
            </label>
            <label className="col-span-2 flex items-center gap-2 text-[11px] font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={track.locked === true}
                onChange={(e) => patchTrack(track.id, { locked: e.target.checked })}
              />
              A pagamento: le ricompense mostrano il lucchetto
            </label>
            <button
              type="button"
              onClick={() => void removeTrack(track.id)}
              disabled={selectedList.tracks.length <= 1}
              className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 flex items-center justify-center cursor-pointer"
              title="Rimuovi traccia e le sue ricompense"
              aria-label={`Rimuovi la traccia ${track.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={newTrackId}
            onChange={(e) => setNewTrackId(e.target.value.trim())}
            onKeyDown={(e) => e.key === 'Enter' && addTrack()}
            placeholder="id-nuova-traccia (es. legacy)"
            className={`${inputClass} font-mono`}
          />
          <button
            type="button"
            onClick={addTrack}
            disabled={!newTrackId || Boolean(idError)}
            className="shrink-0 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <Plus size={13} /> Traccia
          </button>
        </div>
        {idError && <p className="text-[10px] text-red-500">{idError}</p>}
      </div>

      <div className="space-y-2 pt-2 border-t border-purple-200/70 dark:border-purple-900/40">
        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <ArchiveRestore size={13} /> Cestino ({passTrash.length})
        </span>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          Le tracce rimosse restano in <code className="font-mono">dev-trash/trash.json</code>: il file è nel repository ma non entra nella build.
        </p>
        {trashMessage && <p className="text-[10px] text-red-500">{trashMessage}</p>}
        {passTrash.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl">
            <span className="flex-1 min-w-0 text-[11px] font-medium truncate" title={entry.label}>
              {entry.payload.track.name} · {entry.payload.rewards.length} ricompense
              <span className="text-gray-400"> · {new Date(entry.deletedAt).toLocaleDateString('it-IT')}</span>
            </span>
            <button
              type="button"
              onClick={() => restoreTrack(entry)}
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 cursor-pointer"
            >
              Ripristina
            </button>
            <button
              type="button"
              onClick={() => purge(entry.id)}
              className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer"
              title="Elimina definitivamente dal cestino"
              aria-label="Elimina definitivamente"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
