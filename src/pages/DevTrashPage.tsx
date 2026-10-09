import { useCallback, useEffect, useState } from 'react';
import { ArchiveRestore, ArrowLeft, Code2, Layers, Loader2, Ticket, Trash2 } from 'lucide-react';
import { SectionHeader } from '@/components/SectionHeader';
import { IconButton } from '@/components/IconButton';
import { StickyHeader } from '@/components/StickyHeader';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { BottomSheet } from '@/components/BottomSheet';
import {
  clearAllTrash,
  isListEntry,
  isPassTrackEntry,
  listTrash,
  removeFromTrash,
  type DevTrashEntry,
} from '@/lib/devTrash';
import { artifactIdForBucket, restoreEntryToDraft } from '@/lib/devTrashRestore';
import { getDevArtifacts } from '@/lib/devArtifacts';
import { applyArtifacts } from '@/lib/devApply';

interface DevTrashPageProps {
  onBack: () => void;
}

type Pending =
  | { kind: 'restore'; entry: DevTrashEntry }
  | { kind: 'purge'; entry: DevTrashEntry }
  | { kind: 'clear' }
  | { kind: 'force'; artifactId: string; entryLabel: string }
  | null;

/** Riga di sintesi di una voce: cosa contiene e dove tornerebbe. */
function describeEntry(entry: DevTrashEntry): { icon: React.ReactNode; type: string; detail: string } {
  if (isListEntry(entry)) {
    const list = entry.payload.list;
    return {
      icon: <Layers size={16} className="text-purple-500" />,
      type: 'Lista',
      detail: `${list.listType} · ${list.levels.length} livelli · id ${list.id}`,
    };
  }
  if (isPassTrackEntry(entry)) {
    const p = entry.payload;
    return {
      icon: <Ticket size={16} className="text-rose-500" />,
      type: 'Traccia di pass',
      detail: `${p.track.name} · ${p.rewards.length} ricompense · pass ${p.listId}`,
    };
  }
  return { icon: <Code2 size={16} className="text-gray-400" />, type: entry.kind, detail: 'Tipo non ripristinabile da qui' };
}

/**
 * Gestione del cestino Dev (`dev-trash/trash.json`): elenco di ciò che l'editor ha eliminato, con
 * ripristino nel file di riferimento (subito o in seguito) ed eliminazione definitiva, singola o totale.
 */
export function DevTrashPage({ onBack }: DevTrashPageProps) {
  const [entries, setEntries] = useState<DevTrashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const result = await listTrash();
    setLoading(false);
    if (result.ok) setEntries(result.entries);
    else setMessage({ text: result.message, tone: 'error' });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale dal dev server
    void refresh();
  }, [refresh]);

  const purge = async (entry: DevTrashEntry) => {
    const result = await removeFromTrash(entry.id);
    if (result.ok) setEntries(result.entries);
    else setMessage({ text: result.message, tone: 'error' });
  };

  const clearAll = async () => {
    const result = await clearAllTrash();
    if (result.ok) setEntries(result.entries);
    else setMessage({ text: result.message, tone: 'error' });
  };

  /** Scrive nel file di riferimento la bozza già ripristinata; a riuscita ricarica la pagina (i dati partono dai file). */
  const applyDraft = async (artifactId: string, force: boolean) => {
    const artifact = getDevArtifacts().find((a) => a.id === artifactId);
    if (!artifact) {
      setMessage({ text: 'File di riferimento non trovato.', tone: 'error' });
      return;
    }
    setBusy(true);
    const outcome = await applyArtifacts([artifact], force);
    setBusy(false);
    switch (outcome.status) {
      case 'ok':
        setMessage({ text: `Scritto: ${outcome.written.join(', ')}`, tone: 'info' });
        setTimeout(() => window.location.reload(), 700);
        break;
      case 'conflict':
        setPending({ kind: 'force', artifactId, entryLabel: artifact.file });
        break;
      case 'nothing':
        setMessage({ text: 'Nessuna modifica da applicare.', tone: 'info' });
        break;
      default:
        setMessage({ text: outcome.message, tone: 'error' });
    }
  };

  /**
   * Ripristina la voce nei dati di lavoro e la toglie dal cestino. Con `applyNow` riscrive subito anche
   * il file di riferimento; altrimenti resta nella bozza, da applicare in seguito (Dashboard Dev o pagina delle liste).
   */
  const restore = async (entry: DevTrashEntry, applyNow: boolean) => {
    const restored = restoreEntryToDraft(entry);
    if (!restored.ok) {
      setMessage({ text: restored.message, tone: 'error' });
      return;
    }
    await purge(entry);
    const artifactId = artifactIdForBucket(restored.bucket);
    if (!applyNow || artifactId === null) {
      setMessage({
        text: artifactId === null
          ? 'Ripristinata nella bozza: le liste personalizzate non hanno un file di riferimento.'
          : `Ripristinata nella bozza di ${getDevArtifacts().find((a) => a.id === artifactId)?.file ?? 'src/data'}: applicala dalla Dashboard Dev o da Gestione Liste.`,
        tone: 'info',
      });
      return;
    }
    await applyDraft(artifactId, false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <StickyHeader>
        <SectionHeader
          title="Cestino Dev"
          leading={<IconButton onClick={onBack} title="Indietro"><ArrowLeft size={16} /></IconButton>}
          actions={
            <button
              type="button"
              disabled={entries.length === 0 || busy}
              onClick={() => setPending({ kind: 'clear' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 size={13} /> Svuota cestino
            </button>
          }
        />
      </StickyHeader>

      <div className="p-4 space-y-4">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Ciò che elimini da Gestione Liste (liste e tracce dei pass) resta in <code className="font-mono">dev-trash/trash.json</code>:
          il file è nel repository ma non entra nella build. Da qui puoi ripristinarlo nel suo file di riferimento oppure eliminarlo per sempre.
        </p>

        {message && (
          <p
            role="status"
            className={message.tone === 'error' ? 'text-xs font-semibold text-red-500' : 'text-xs font-semibold text-emerald-600 dark:text-emerald-400'}
          >
            {message.text}
          </p>
        )}

        {loading ? (
          <div className="p-10 flex justify-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center space-y-2 bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-[28px]">
            <ArchiveRestore size={26} className="mx-auto text-gray-400" />
            <p className="text-sm font-bold">Il cestino è vuoto</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => {
              const info = describeEntry(entry);
              const restorable = isListEntry(entry) || isPassTrackEntry(entry);
              return (
                <li key={entry.id} className="p-3.5 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[24px]">
                  <span className="shrink-0">{info.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold truncate" title={entry.label}>{entry.label}</span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {info.type} · {info.detail} · eliminata il {new Date(entry.deletedAt).toLocaleString('it-IT')}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={!restorable || busy}
                    onClick={() => setPending({ kind: 'restore', entry })}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Ripristina
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPending({ kind: 'purge', entry })}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer"
                    title="Elimina definitivamente"
                    aria-label={`Elimina definitivamente ${entry.label}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pending?.kind === 'restore' && (
        <BottomSheet
          title="Ripristina"
          onClose={() => setPending(null)}
          overlayZ="z-60"
          footer={
            <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <button
                type="button"
                onClick={() => { const e = pending.entry; setPending(null); void restore(e, true); }}
                className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full cursor-pointer"
              >
                Ripristina e applica subito al file
              </button>
              <button
                type="button"
                onClick={() => { const e = pending.entry; setPending(null); void restore(e, false); }}
                className="w-full py-3 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full cursor-pointer"
              >
                Ripristina nella bozza, applico dopo
              </button>
              <button type="button" onClick={() => setPending(null)} className="w-full py-2.5 text-xs font-bold text-gray-500 cursor-pointer">
                Annulla
              </button>
            </div>
          }
        >
          <div className="py-4 px-2 space-y-2 text-center">
            <p className="text-sm font-semibold">{pending.entry.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              L'elemento viene reinserito nei dati di lavoro. Puoi riscrivere subito il file di riferimento
              (la pagina si ricarica) oppure lasciarlo nella bozza e applicarlo più tardi dalla Dashboard Dev.
            </p>
          </div>
        </BottomSheet>
      )}

      {pending?.kind === 'purge' && (
        <ConfirmActionModal
          title="Elimina definitivamente"
          message={`Eliminare per sempre «${pending.entry.label}»?`}
          description="Non potrai più recuperarlo dal cestino."
          confirmText="Elimina"
          onConfirm={() => void purge(pending.entry)}
          onClose={() => setPending(null)}
        />
      )}

      {pending?.kind === 'clear' && (
        <ConfirmActionModal
          title="Svuota il cestino"
          message={`Eliminare definitivamente tutte le ${entries.length} voci del cestino?`}
          description="L'operazione non si può annullare."
          confirmText="Svuota"
          onConfirm={() => void clearAll()}
          onClose={() => setPending(null)}
        />
      )}

      {pending?.kind === 'force' && (
        <ConfirmActionModal
          title="File modificato su disco"
          message={`${pending.entryLabel} è diverso da come l'app l'aveva caricato.`}
          description="Sovrascrivendolo perdi quelle modifiche. Controlla con git diff prima di continuare."
          confirmText="Sovrascrivi comunque"
          variant="warning"
          onConfirm={() => void applyDraft(pending.artifactId, true)}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
