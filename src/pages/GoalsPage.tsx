import { useState } from 'react';
import { RotateCcw, GripVertical, PartyPopper } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useAppStore } from '../store';
import { SectionHeader } from '../components/SectionHeader';
import { SortableWorkbenchRow } from '../components/SortableWorkbenchRow';
import { WorkbenchRow } from '../components/WorkbenchRow';

export const GoalsPage = ({ onOpenDatabase }: { onOpenDatabase: () => void }) => {
  const store = useAppStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // Workbench that just reached max level, awaiting the "move to bottom of priorities?" answer
  const [movePromptId, setMovePromptId] = useState<string | null>(null);
  const orderedWorkbenches = store.getOrderedWorkbenches();

  const activeWBs = orderedWorkbenches.filter(wb => (store.hideoutLevels[wb.id] ?? 0) < wb.maxLevel);
  const maxedWBs = orderedWorkbenches.filter(wb => (store.hideoutLevels[wb.id] ?? 0) >= wb.maxLevel);
  // Hide the prompt if the bench was corrected back below max in the meantime
  const movePromptWb = maxedWBs.find(wb => wb.id === movePromptId);

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

  const handleCurrentLevel = (wbId: string, maxLevel: number) => (v: number, deduct: boolean) => {
    store.setModuleCurrentLevel(wbId, v, deduct);
    if (v >= maxLevel) setMovePromptId(wbId);
  };

  const moveToBottom = (wbId: string) => {
    store.setWorkbenchOrder([...store.workbenchOrder.filter(id => id !== wbId), wbId]);
    setMovePromptId(null);
  };

  return (
    <div className="p-4 pb-28">
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
        <SortableContext items={activeWBs.map(wb => wb.id)} strategy={verticalListSortingStrategy}>
          {activeWBs.map(wb => (
            <SortableWorkbenchRow key={wb.id} wb={wb}
              current={store.hideoutLevels[wb.id] ?? 0}
              target={store.targetLevels[wb.id] ?? wb.maxLevel}
              isActive={store.activeModules[wb.id]}
              inventory={store.inventory}
              otherNeeds={store.getTotalRequiredMaterials(wb.id)}
              onToggle={() => store.toggleModuleActive(wb.id)}
              onCurrentLevel={handleCurrentLevel(wb.id, wb.maxLevel)}
              onTargetLevel={v => store.setModuleTargetLevel(wb.id, v)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {maxedWBs.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mt-4 mb-2 px-1">Completati</p>

          {movePromptWb && (
            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <PartyPopper size={14} className="text-green-500 shrink-0" />
                <span><strong>{movePromptWb.name}</strong> completato! Spostarlo in fondo alle priorità?</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => moveToBottom(movePromptWb.id)}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-full">
                  Sì, sposta
                </button>
                <button onClick={() => setMovePromptId(null)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full">
                  No, lascia
                </button>
              </div>
            </div>
          )}

          {maxedWBs.map(wb => (
            <WorkbenchRow key={wb.id} wb={wb}
              current={store.hideoutLevels[wb.id] ?? 0}
              target={store.targetLevels[wb.id] ?? wb.maxLevel}
              isActive={store.activeModules[wb.id]}
              inventory={store.inventory}
              otherNeeds={store.getTotalRequiredMaterials(wb.id)}
              onToggle={() => store.toggleModuleActive(wb.id)}
              onCurrentLevel={handleCurrentLevel(wb.id, wb.maxLevel)}
              onTargetLevel={v => store.setModuleTargetLevel(wb.id, v)}
            />
          ))}
        </>
      )}
    </div>
  );
};
