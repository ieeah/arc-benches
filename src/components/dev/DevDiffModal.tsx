import { useEffect, useMemo, useState } from 'react';
import { X, Copy, Check, FileDiff } from 'lucide-react';
import { computeJsonDiff } from '@/lib/devDiff';
import { cn } from '@/lib/cn';

export type DevDiffModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  filename?: string;
  originalValue: unknown;
  modifiedValue: unknown;
  onApply?: () => void;
};

export function DevDiffModal({
  isOpen,
  onClose,
  title = 'Confronto modifiche (Diff)',
  filename,
  originalValue,
  modifiedValue,
  onApply,
}: DevDiffModalProps) {
  const [copiedType, setCopiedType] = useState<'diff' | 'json' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const diff = useMemo(
    () => computeJsonDiff(originalValue, modifiedValue),
    [originalValue, modifiedValue],
  );

  if (!isOpen) return null;

  const handleCopyDiff = async () => {
    const text = diff.diffLines.map((l) => l.text).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedType('diff');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyJson = async () => {
    const text =
      typeof modifiedValue === 'string'
        ? modifiedValue
        : JSON.stringify(modifiedValue, null, 2);
    await navigator.clipboard.writeText(text);
    setCopiedType('json');
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dev-diff-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-900 dark:text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileDiff size={18} className="text-blue-500 shrink-0" />
              <h2 id="dev-diff-modal-title" className="text-sm font-bold truncate">
                {title}
              </h2>
              {filename && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {filename}
                </span>
              )}
            </div>

            {/* Badges di riepilogo */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className="px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                title="Aggiunte"
              >
                +{diff.summary.added}
              </span>
              <span
                className="px-2 py-0.5 rounded-md font-mono font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"
                title="Rimozioni"
              >
                -{diff.summary.removed}
              </span>
              <span
                className="px-2 py-0.5 rounded-md font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                title="Modifiche"
              >
                ~{diff.summary.changed}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyDiff}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="Copia righe di diff"
            >
              {copiedType === 'diff' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedType === 'diff' ? 'Diff copiato' : 'Copia Diff'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="Copia JSON completo modificato"
            >
              {copiedType === 'json' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedType === 'json' ? 'JSON copiato' : 'Copia JSON'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi finestra diff"
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Diff code viewer */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-950 text-gray-200 font-mono text-xs space-y-0.5">
          {!diff.hasChanges ? (
            <div className="py-12 text-center text-gray-500 italic">
              Nessuna differenza: il contenuto è identico alla versione originale.
            </div>
          ) : (
            diff.diffLines.map((line, idx) => {
              let style = 'text-gray-400';
              if (line.type === 'add') {
                style = 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500 pl-2 -ml-2';
              } else if (line.type === 'remove') {
                style = 'bg-red-950/60 text-red-300 border-l-2 border-red-500 pl-2 -ml-2';
              } else if (line.type === 'change') {
                style = 'bg-amber-950/50 text-amber-200 border-l-2 border-amber-500 pl-2 -ml-2';
              }

              return (
                <div
                  key={idx}
                  className={cn(
                    'whitespace-pre-wrap break-all py-0.5 px-1 font-mono text-[11px] leading-relaxed',
                    style,
                  )}
                >
                  {line.text}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 sm:px-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {diff.hasChanges
              ? `${diff.summary.added} aggiunti, ${diff.summary.removed} rimossi, ${diff.summary.changed} modificati`
              : 'Nessuna modifica rilevata'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            >
              Chiudi
            </button>
            {onApply && (
              <button
                type="button"
                onClick={() => {
                  onApply();
                  onClose();
                }}
                disabled={!diff.hasChanges}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                <Check size={14} />
                <span>Applica modifiche</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
