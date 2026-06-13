import { useState, type ReactNode } from 'react';
import type { Workbench } from '../types';
import { LevelBadge } from './LevelBadge';
import { LevelPills } from './LevelPills';

/** Goal card for a workbench. Pass `dragHandle` to render a sort handle (see SortableWorkbenchRow). */
export const WorkbenchRow = ({ wb, current, target, isActive, inventory, otherNeeds, dragHandle, onToggle, onCurrentLevel, onTargetLevel }: {
  wb: Workbench; current: number; target: number; isActive: boolean;
  inventory: Record<string, number>;
  /** Materials still required by the OTHER active goals (see getTotalRequiredMaterials(wb.id)) */
  otherNeeds: Record<string, number>;
  dragHandle?: ReactNode;
  onToggle: () => void;
  onCurrentLevel: (v: number, deductMaterials: boolean) => void;
  onTargetLevel: (v: number) => void;
}) => {
  // A workbench whose level 1 has no requirements starts already unlocked (e.g. Scrappy) — level 0 doesn't exist
  const baseLevel = wb.levels.find(l => l.level === 1)?.requirementItemIds.length === 0 ? 1 : 0;

  // Level increase pending deduction confirmation
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);

  // Raising the level means the upgrade was paid in game, so tracked materials get deducted
  // automatically (missing ones were found and spent untracked: net zero). The question is asked
  // only on a real conflict: a tracked material that another active goal also needs might be
  // reserved for that goal rather than spent here.
  const hasConflict = (level: number) =>
    wb.levels.some(l =>
      l.level > current && l.level <= level &&
      l.requirementItemIds.some(req =>
        (inventory[req.itemId] ?? 0) > 0 && (otherNeeds[req.itemId] ?? 0) > 0)
    );

  const handleCurrentLevel = (level: number) => {
    setPendingLevel(null);
    if (level <= current) {
      onCurrentLevel(level, false); // lowering never refunds: plain correction
    } else if (hasConflict(level)) {
      setPendingLevel(level); // ask before touching materials other goals may need
    } else {
      onCurrentLevel(level, true); // reconcile the inventory automatically
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
                Alcuni materiali in inventario servono anche ad altri banchi. Li hai usati per questo potenziamento?
              </p>
              <div className="flex gap-2">
                <button onClick={() => resolvePending(true)}
                  className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                  Sì, scala
                </button>
                <button onClick={() => resolvePending(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full">
                  No, conservali
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
