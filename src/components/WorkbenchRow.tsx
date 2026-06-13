import { useState, type ReactNode } from 'react';
import type { Workbench } from '../types';
import { LevelBadge } from './LevelBadge';
import { LevelPills } from './LevelPills';

/** Goal card for a workbench. Pass `dragHandle` to render a sort handle (see SortableWorkbenchRow). */
export const WorkbenchRow = ({ wb, current, target, isActive, inventory, dragHandle, onToggle, onCurrentLevel, onTargetLevel }: {
  wb: Workbench; current: number; target: number; isActive: boolean;
  inventory: Record<string, number>;
  dragHandle?: ReactNode;
  onToggle: () => void;
  onCurrentLevel: (v: number, deductMaterials: boolean) => void;
  onTargetLevel: (v: number) => void;
}) => {
  // A workbench whose level 1 has no requirements starts already unlocked (e.g. Scrappy) — level 0 doesn't exist
  const baseLevel = wb.levels.find(l => l.level === 1)?.requirementItemIds.length === 0 ? 1 : 0;

  // Level increase pending deduction confirmation
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);

  // True if the user owns any of the materials required by levels (current+1 .. level):
  // only then does the deduction question change anything
  const ownsRelevantMaterials = (level: number) =>
    wb.levels.some(l =>
      l.level > current && l.level <= level &&
      l.requirementItemIds.some(req => (inventory[req.itemId] ?? 0) > 0)
    );

  const handleCurrentLevel = (level: number) => {
    setPendingLevel(null);
    if (level > current && ownsRelevantMaterials(level)) {
      setPendingLevel(level); // ask before touching the inventory
    } else {
      onCurrentLevel(level, false); // lowering or nothing to deduct: plain correction
    }
  };

  const resolvePending = (deduct: boolean) => {
    if (pendingLevel !== null) onCurrentLevel(pendingLevel, deduct);
    setPendingLevel(null);
  };

  return (
    <div className="mb-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[24px] overflow-hidden">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {dragHandle}
        <span className="font-bold flex-1">{wb.name}</span>
        <LevelBadge current={current} max={wb.maxLevel} state={current >= wb.maxLevel ? 'maxed' : 'default'} />
        <input type="checkbox" checked={isActive} onChange={onToggle}
          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer" />
      </div>

      <div className="px-4 pb-3 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Attuale</p>
          <LevelPills min={baseLevel} max={wb.maxLevel} value={pendingLevel ?? current}
            activeClass={pendingLevel !== null ? 'bg-blue-300 dark:bg-blue-700 text-white' : 'bg-blue-500 text-white'}
            onChange={handleCurrentLevel} />
          {pendingLevel !== null && (
            <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-2">
                Scalare i materiali usati dall'inventario?
              </p>
              <div className="flex gap-2">
                <button onClick={() => resolvePending(true)}
                  className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                  Sì, scala
                </button>
                <button onClick={() => resolvePending(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full">
                  No, solo correzione
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Obiettivo</p>
          <LevelPills min={baseLevel} max={wb.maxLevel} value={target} minSelectable={current + 1}
            activeClass="bg-green-500 text-white" onChange={onTargetLevel} />
        </div>
      </div>
    </div>
  );
};
