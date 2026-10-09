import { useCallback, useEffect, useState } from 'react';
import { ArchiveRestore, X } from 'lucide-react';
import type { List } from '@/types';
import { Drawer } from '@/components/Drawer';
import { isListEntry, listTrash, removeFromTrash, type DevTrashEntry } from '@/lib/devTrash';

interface DevListsTrashProps {
  /** Cambia quando il cestino viene modificato da fuori (es. una lista appena eliminata). */
  refreshKey: number;
  /** Rimette la lista nei dati di lavoro; restituisce un messaggio d'errore se non è possibile. */
  onRestore: (list: List) => string | null;
}

/** Cestino delle liste eliminate dall'editor (`dev-trash/trash.json`): elenco, ripristino ed eliminazione definitiva. */
export const DevListsTrash = ({ refreshKey, onRestore }: DevListsTrashProps) => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DevTrashEntry[]>([]);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    const result = await listTrash();
    if (result.ok) {
      setEntries(result.entries);
      setMessage('');
    } else setMessage(result.message);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento dal dev server
    void refresh();
  }, [refresh, refreshKey]);

  const lists = entries.filter(isListEntry);

  const restore = async (entry: DevTrashEntry & { payload: { list: List } }) => {
    const error = onRestore(entry.payload.list);
    if (error) return setMessage(error);
    const removed = await removeFromTrash(entry.id);
    if (removed.ok) setEntries(removed.entries);
    else setMessage(removed.message);
  };

  const purge = async (id: string) => {
    const removed = await removeFromTrash(id);
    if (removed.ok) setEntries(removed.entries);
    else setMessage(removed.message);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
        title="Liste eliminate dall'editor, recuperabili"
      >
        <ArchiveRestore size={14} />
        <span>Cestino ({lists.length})</span>
      </button>

      {open && (
        <Drawer from="top" title="Cestino liste" onClose={() => setOpen(false)}>
          <div className="space-y-3 pb-4">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Le liste eliminate restano in <code className="font-mono">dev-trash/trash.json</code>: il file è nel repository ma non entra nella build.
            </p>
            {message && <p className="text-[11px] text-red-500">{message}</p>}
            {lists.length === 0 ? (
              <p className="p-4 text-xs text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                Il cestino è vuoto.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {lists.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <span className="flex-1 min-w-0 text-xs font-medium truncate" title={entry.label}>
                      {entry.payload.list.name}
                      <span className="text-gray-400">
                        {' '}· {entry.payload.list.listType} · {new Date(entry.deletedAt).toLocaleDateString('it-IT')}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void restore(entry)}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 cursor-pointer"
                    >
                      Ripristina
                    </button>
                    <button
                      type="button"
                      onClick={() => void purge(entry.id)}
                      className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer"
                      title="Elimina definitivamente dal cestino"
                      aria-label="Elimina definitivamente"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Drawer>
      )}
    </>
  );
};
