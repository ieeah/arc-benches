import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Workbench } from '../types';
import { LevelBadge } from './LevelBadge';
import { LevelPills } from './LevelPills';

export const SortableWorkbenchRow = ({ wb, current, target, isActive, onToggle, onCurrentLevel, onTargetLevel }: {
  wb: Workbench; current: number; target: number; isActive: boolean;
  onToggle: () => void; onCurrentLevel: (v: number) => void; onTargetLevel: (v: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: wb.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  // A workbench whose level 1 has no requirements starts already unlocked (e.g. Scrappy) — level 0 doesn't exist
  const baseLevel = wb.levels.find(l => l.level === 1)?.requirementItemIds.length === 0 ? 1 : 0;

  return (
    <div ref={setNodeRef} style={style}
      className="mb-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[24px] overflow-hidden">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button {...attributes} {...listeners}
          className="text-gray-300 dark:text-gray-600 touch-none cursor-grab active:cursor-grabbing">
          <GripVertical size={18} />
        </button>
        <span className="font-bold flex-1">{wb.name}</span>
        <LevelBadge current={current} max={wb.maxLevel} state={current >= wb.maxLevel ? 'maxed' : 'default'} />
        <input type="checkbox" checked={isActive} onChange={onToggle}
          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer" />
      </div>

      <div className="px-4 pb-3 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Attuale</p>
          <LevelPills min={baseLevel} max={wb.maxLevel} value={current}
            activeClass="bg-blue-500 text-white" onChange={onCurrentLevel} />
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
