import { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, Info } from 'lucide-react';
import type { List } from '@/types';
import { useAppStore } from '@/store';
import { getEffectiveCustomItems } from '@/lib/customItems';
import { findListIssues, reviewNotes, type IssueSeverity } from '@/lib/listIssues';
import { cn } from '@/lib/cn';

const STYLE: Record<IssueSeverity, { icon: typeof Info; box: string; label: string }> = {
  error: { icon: AlertCircle, box: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60', label: 'Errori' },
  warning: { icon: AlertTriangle, box: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60', label: 'Da rivedere' },
  info: { icon: Info, box: 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900/60', label: 'Note' },
};

const formatLevels = (levels: number[]) => (levels.length > 12 ? `Lvl ${levels.slice(0, 12).join(', ')}… (+${levels.length - 12})` : `Lvl ${levels.join(', ')}`);

/**
 * Cosa della lista selezionata va corretto a mano: oggetti mancanti dal catalogo, oggetti custom con
 * note «da rivedere», mappe sconosciute e, per i pass, tracce e livelli vuoti.
 */
export const DevListIssues = ({ list }: { list: List }) => {
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const [open, setOpen] = useState(true);
  const issues = useMemo(
    () => findListIssues(list, itemsInfo, reviewNotes(getEffectiveCustomItems())),
    [list, itemsInfo],
  );

  if (issues.length === 0) return null;
  const counts = (['error', 'warning', 'info'] as const).map((s) => ({ severity: s, n: issues.filter((i) => i.severity === s).length })).filter((c) => c.n > 0);

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden" aria-label="Da correggere">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left cursor-pointer"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Da correggere ({issues.length})</span>
        <span className="flex items-center gap-1.5 ml-1">
          {counts.map((c) => (
            <span key={c.severity} className={cn('px-2 py-0.5 rounded-full text-[10px] font-black border', STYLE[c.severity].box)}>
              {c.n} {STYLE[c.severity].label.toLowerCase()}
            </span>
          ))}
        </span>
        <ChevronDown size={14} className={cn('ml-auto text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="px-3.5 pb-3 space-y-1.5 max-h-72 overflow-y-auto">
          {issues.map((issue, index) => {
            const { icon: Icon, box } = STYLE[issue.severity];
            return (
              <li key={index} className={cn('flex items-start gap-2 p-2 rounded-xl border text-[11px] leading-snug', box)}>
                <Icon size={13} className="shrink-0 mt-0.5" />
                <span className="min-w-0">
                  {issue.message}
                  {issue.levels && issue.levels.length > 0 && <span className="opacity-70"> · {formatLevels(issue.levels)}</span>}
                </span>
              </li>
            );
          })}
          <li className="text-[10px] text-gray-400 px-1 pt-1">
            Gli oggetti si correggono nel <a className="underline" href="#/dev-custom-items">Custom Items Studio</a>.
          </li>
        </ul>
      )}
    </section>
  );
};
