import { Link2, Plus, Trash2 } from 'lucide-react';
import type { LevelRequirement, List } from '@/types';

const inputClass =
  'px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500';

/**
 * Editor dei requisiti di un livello su altre liste (es. Research Station Lvl 2 richiede Outpost Lvl 2):
 * la lista richiesta deve essere almeno a quel livello perché il livello si possa raggiungere.
 */
export const DevLevelRequirements = ({
  requires,
  lists,
  currentListId,
  onChange,
}: {
  requires: LevelRequirement[];
  lists: List[];
  currentListId: string;
  onChange: (next: LevelRequirement[]) => void;
}) => {
  const others = lists.filter((l) => l.id !== currentListId);
  const update = (index: number, patch: Partial<LevelRequirement>) =>
    onChange(requires.map((req, i) => (i === index ? { ...req, ...patch } : req)));

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Link2 size={14} className="text-amber-500" />
          Requisiti su altre liste ({requires.length})
        </h3>
        <button
          type="button"
          disabled={others.length === 0}
          onClick={() => onChange([...requires, { listId: others[0].id, level: 1 }])}
          className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
        >
          <Plus size={13} />
          <span>Aggiungi requisito</span>
        </button>
      </div>

      {requires.length === 0 ? (
        <p className="text-[11px] text-gray-400">
          Nessuno: il livello dipende solo da materiali e azioni. Un requisito blocca il livello finché l'altra lista
          non raggiunge il livello indicato.
        </p>
      ) : (
        <div className="space-y-2">
          {requires.map((req, index) => (
            <div key={index} className="flex items-center gap-2 flex-wrap p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <select
                value={req.listId}
                onChange={(e) => update(index, { listId: e.target.value })}
                className={`${inputClass} flex-1 min-w-[10rem]`}
                aria-label="Lista richiesta"
              >
                {!others.some((l) => l.id === req.listId) && <option value={req.listId}>{req.listId} (non trovata)</option>}
                {others.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.listType})
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                Lvl
                <input
                  type="number"
                  min={1}
                  value={req.level}
                  onChange={(e) => update(index, { level: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className={`${inputClass} w-16`}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange(requires.filter((_, i) => i !== index))}
                aria-label="Rimuovi requisito"
                className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
