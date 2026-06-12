import { useState } from 'react';
import { RotateCcw, GripVertical } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useAppStore } from '../store';
import { SectionHeader } from '../components/SectionHeader';
import { SortableWorkbenchRow } from '../components/SortableWorkbenchRow';

export const GoalsPage = ({ onOpenDatabase }: { onOpenDatabase: () => void }) => {
  const store = useAppStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const orderedWorkbenches = store.getOrderedWorkbenches();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = store.workbenchOrder.indexOf(active.id as string);
    const newIndex = store.workbenchOrder.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1)
      store.setWorkbenchOrder(arrayMove(store.workbenchOrder, oldIndex, newIndex));
  };

  return (
    <div className="p-4 pb-24">
      <div className="mb-4">
        <SectionHeader title="Obiettivi" onOpenDatabase={onOpenDatabase}
          actions={showResetConfirm ? (
            <div className="flex gap-2">
              <button onClick={() => { store.resetProgress(); setShowResetConfirm(false); }}
                className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                Conferma
              </button>
              <button onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full">
                Annulla
              </button>
            </div>
          ) : (
            <button onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold rounded-full">
              <RotateCcw size={13} />
              Ripristina
            </button>
          )}
        />
      </div>

      <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1">
        <GripVertical size={13} />
        Trascina per cambiare la priorità di visualizzazione
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={store.workbenchOrder} strategy={verticalListSortingStrategy}>
          {orderedWorkbenches.map(wb => (
            <SortableWorkbenchRow key={wb.id} wb={wb}
              current={store.hideoutLevels[wb.id] ?? 0}
              target={store.targetLevels[wb.id] ?? wb.maxLevel}
              isActive={store.activeModules[wb.id]}
              inventory={store.inventory}
              onToggle={() => store.toggleModuleActive(wb.id)}
              onCurrentLevel={(v, deduct) => store.setModuleCurrentLevel(wb.id, v, deduct)}
              onTargetLevel={v => store.setModuleTargetLevel(wb.id, v)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
