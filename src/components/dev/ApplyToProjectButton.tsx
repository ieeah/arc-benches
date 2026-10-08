import { useState } from 'react';
import { FileCheck2, Loader2 } from 'lucide-react';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { getDevArtifacts } from '@/lib/devArtifacts';
import { applyArtifacts } from '@/lib/devApply';
import { cn } from '@/lib/cn';

interface ApplyToProjectButtonProps {
  /** Id degli artefatti (vedi `getDevArtifacts`) che questo pulsante scrive nel progetto. */
  artifactIds: string[];
  label?: string;
  disabled?: boolean;
  className?: string;
}

type Status = 'idle' | 'busy' | 'done' | 'nothing' | 'error';

/**
 * Scrive direttamente nei file del repository le modifiche degli strumenti Dev (solo sul dev server).
 * Se un file su disco è cambiato rispetto a quello caricato dall'app chiede conferma prima di
 * sovrascriverlo; a scrittura riuscita ricarica la pagina, così l'app parte dai nuovi file.
 */
export function ApplyToProjectButton({ artifactIds, label = 'Applica al file', disabled, className }: ApplyToProjectButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [conflicts, setConflicts] = useState<string[] | null>(null);

  const run = async (force = false) => {
    setStatus('busy');
    setConflicts(null);
    const artifacts = getDevArtifacts().filter((a) => artifactIds.includes(a.id));
    const outcome = await applyArtifacts(artifacts, force);

    switch (outcome.status) {
      case 'ok':
        setStatus('done');
        setMessage(`Scritto: ${outcome.written.join(', ')}`);
        setTimeout(() => window.location.reload(), 700);
        break;
      case 'conflict':
        setStatus('idle');
        setConflicts(outcome.conflicts);
        break;
      case 'nothing':
        setStatus('nothing');
        setMessage('Nessuna modifica da applicare.');
        setTimeout(() => setStatus('idle'), 2500);
        break;
      default:
        setStatus('error');
        setMessage(outcome.message);
    }
  };

  const busy = status === 'busy' || status === 'done';

  return (
    <>
      <button
        type="button"
        onClick={() => run()}
        disabled={disabled || busy}
        className={cn(
          'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer',
          'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        title="Scrive le modifiche direttamente nei file del progetto (solo con il dev server in locale)"
      >
        {status === 'busy' ? <Loader2 size={13} className="animate-spin" /> : <FileCheck2 size={13} />}
        <span>{label}</span>
      </button>

      {status !== 'idle' && status !== 'busy' && message && (
        <span
          role="status"
          className={cn(
            'text-[11px] font-semibold max-w-64 truncate',
            status === 'error' ? 'text-red-500' : status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500',
          )}
          title={message}
        >
          {message}
        </span>
      )}

      {conflicts && (
        <ConfirmActionModal
          title="File modificato su disco"
          message={`${conflicts.join(', ')} ${conflicts.length === 1 ? 'è' : 'sono'} diverso da come l'app l'aveva caricato.`}
          description="Qualcuno (o un altro editor) lo ha cambiato nel frattempo: sovrascrivendolo perdi quelle modifiche. Controlla con git diff prima di continuare."
          confirmText="Sovrascrivi comunque"
          variant="warning"
          onConfirm={() => run(true)}
          onClose={() => setConflicts(null)}
        />
      )}
    </>
  );
}
