import React from 'react';
import { RotateCcw, Copy, Check, Download, FileDiff } from 'lucide-react';
import { ApplyToProjectButton } from '@/components/dev/ApplyToProjectButton';
import { cn } from '@/lib/cn';

export type DevStickyActionBarProps = {
  variant?: 'sticky' | 'header';
  onResetDraft?: () => void;
  resetLabel?: string;
  resetTitle?: string;
  onCopyJson?: () => void;
  copied?: boolean;
  onDownload?: () => void;
  downloadLabel?: string;
  downloadTitle?: string;
  downloadColor?: 'blue' | 'emerald' | 'gray';
  isModified?: boolean;
  unappliedFilename?: string | string[];
  applyArtifactIds?: string[];
  applyLabel?: string;
  applyDisabled?: boolean;
  onViewDiff?: () => void;
  extraActions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function DevStickyActionBar({
  variant = 'sticky',
  onResetDraft,
  resetLabel = 'Ripristina',
  resetTitle = 'Ripristina bozza allo stato iniziale',
  onCopyJson,
  copied = false,
  onDownload,
  downloadLabel = 'Scarica',
  downloadTitle = 'Scarica file JSON',
  downloadColor = 'blue',
  isModified,
  unappliedFilename,
  applyArtifactIds,
  applyLabel,
  applyDisabled,
  onViewDiff,
  extraActions,
  children,
  className,
}: DevStickyActionBarProps) {
  const downloadColorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    gray: 'bg-gray-700 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white',
  }[downloadColor];

  const showUnappliedBadge =
    Boolean(unappliedFilename) && (isModified === undefined || isModified);

  const unappliedText = Array.isArray(unappliedFilename)
    ? unappliedFilename.join(', ')
    : unappliedFilename;

  const isResetDisabled = isModified !== undefined && !isModified;
  const isDiffDisabled = isModified !== undefined && !isModified;
  const isApplyDisabled =
    applyDisabled !== undefined ? applyDisabled : isModified !== undefined && !isModified;

  const isHeader = variant === 'header';

  return (
    <div
      className={cn(
        isHeader
          ? 'flex flex-wrap items-center gap-2'
          : 'sticky bottom-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs border-t border-gray-200 dark:border-gray-800 p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 shadow-lg',
        className,
      )}
    >
      {/* Gruppo azioni secondarie / esportazione / reset */}
      <div className="flex flex-wrap items-center gap-2">
        {onResetDraft && (
          <button
            type="button"
            onClick={onResetDraft}
            disabled={isResetDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={resetTitle}
          >
            <RotateCcw size={14} />
            <span>{resetLabel}</span>
          </button>
        )}

        {onViewDiff && (
          <button
            type="button"
            onClick={onViewDiff}
            disabled={isDiffDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Confronta le modifiche rispetto all'originale"
          >
            <FileDiff size={14} />
            <span>Diff</span>
          </button>
        )}

        {onCopyJson && (
          <button
            type="button"
            onClick={onCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            title="Copia JSON negli appunti"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Copiato!' : 'Copia JSON'}</span>
          </button>
        )}

        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs',
              downloadColorClasses,
            )}
            title={downloadTitle}
          >
            <Download size={14} />
            <span>{downloadLabel}</span>
          </button>
        )}

        {extraActions}
      </div>

      {/* Gruppo stato bozza e applicazione */}
      <div className="flex flex-wrap items-center gap-2">
        {showUnappliedBadge && unappliedText && (
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50"
            title="Le modifiche restano in bozza nel browser finché non le applichi ai file del progetto"
          >
            Non applicato: {unappliedText}
          </span>
        )}

        {applyArtifactIds && applyArtifactIds.length > 0 && (
          <ApplyToProjectButton
            artifactIds={applyArtifactIds}
            label={applyLabel}
            disabled={isApplyDisabled}
          />
        )}

        {children}
      </div>
    </div>
  );
}
