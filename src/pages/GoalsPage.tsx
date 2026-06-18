import { useState, useRef } from 'react';
import { RotateCcw, GripVertical, PartyPopper, Plus, Download, Upload } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useAppStore } from '../store';
import { SectionHeader } from '../components/SectionHeader';
import { SortableListRow } from '../components/SortableListRow';
import { ListRow } from '../components/ListRow';
import { CustomListEditor } from '../components/CustomListEditor';
import { buildExport, downloadExport, parseImport } from '../lib/listIO';

export const GoalsPage = ({ onOpenDatabase }: { onOpenDatabase: () => void }) => {
  const store = useAppStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [movePromptId, setMovePromptId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id?: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orderedLists = store.getOrderedLists();
  const activeLists = orderedLists.filter(list => (store.hideoutLevels[list.id] ?? 0) < list.maxLevel);
  const maxedLists = orderedLists.filter(list => (store.hideoutLevels[list.id] ?? 0) >= list.maxLevel);
  const movePromptList = maxedLists.find(list => list.id === movePromptId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = store.listOrder.indexOf(active.id as string);
    const newIndex = store.listOrder.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1)
      store.setListOrder(arrayMove(store.listOrder, oldIndex, newIndex));
  };

  const handleCurrentLevel = (listId: string, maxLevel: number) => (v: number, deduct: boolean) => {
    store.setModuleCurrentLevel(listId, v, deduct);
    if (v >= maxLevel) setMovePromptId(listId);
  };

  const moveToBottom = (listId: string) => {
    store.setListOrder([...store.listOrder.filter(id => id !== listId), listId]);
    setMovePromptId(null);
  };

  const handleExport = () => {
    const data = buildExport(
      store.customLists,
      store.hideoutLevels,
      store.targetLevels,
      store.activeModules,
    );
    downloadExport(data);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = parseImport(ev.target?.result as string);
        store.importCustomLists(data);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Errore durante l\'importazione');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
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
            <div className="flex gap-2 items-center">
              <button onClick={() => setEditing({})}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                <Plus size={13} />
                Lista
              </button>
              <button onClick={handleExport} title="Esporta liste custom"
                className="flex items-center p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">
                <Download size={14} />
              </button>
              <button onClick={() => fileInputRef.current?.click()} title="Importa liste custom"
                className="flex items-center p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">
                <Upload size={14} />
              </button>
              <button onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold rounded-full">
                <RotateCcw size={13} />
                Ripristina
              </button>
            </div>
          )}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {importError && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between gap-2">
          <p className="text-[11px] text-red-600 dark:text-red-400">{importError}</p>
          <button onClick={() => setImportError(null)}
            className="text-[11px] text-red-500 font-bold shrink-0">✕</button>
        </div>
      )}

      <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1">
        <GripVertical size={13} />
        Trascina per cambiare la priorità di visualizzazione
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeLists.map(list => list.id)} strategy={verticalListSortingStrategy}>
          {activeLists.map(list => (
            <SortableListRow key={list.id} list={list}
              current={store.hideoutLevels[list.id] ?? 0}
              target={store.targetLevels[list.id] ?? list.maxLevel}
              isActive={store.activeModules[list.id]}
              inventory={store.inventory}
              otherNeeds={store.getTotalRequiredMaterials(list.id)}
              onToggle={() => store.toggleModuleActive(list.id)}
              onCurrentLevel={handleCurrentLevel(list.id, list.maxLevel)}
              onTargetLevel={v => store.setModuleTargetLevel(list.id, v)}
              onEdit={list.custom ? () => setEditing({ id: list.id }) : undefined}
            />
          ))}
        </SortableContext>
      </DndContext>

      {maxedLists.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mt-4 mb-2 px-1">Completati</p>

          {movePromptList && (
            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <PartyPopper size={14} className="text-green-500 shrink-0" />
                <span><strong>{movePromptList.name}</strong> completato! Spostarlo in fondo alle priorità?</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => moveToBottom(movePromptList.id)}
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

          {maxedLists.map(list => (
            <ListRow key={list.id} list={list}
              current={store.hideoutLevels[list.id] ?? 0}
              target={store.targetLevels[list.id] ?? list.maxLevel}
              isActive={store.activeModules[list.id]}
              inventory={store.inventory}
              otherNeeds={store.getTotalRequiredMaterials(list.id)}
              onToggle={() => store.toggleModuleActive(list.id)}
              onCurrentLevel={handleCurrentLevel(list.id, list.maxLevel)}
              onTargetLevel={v => store.setModuleTargetLevel(list.id, v)}
              onEdit={list.custom ? () => setEditing({ id: list.id }) : undefined}
            />
          ))}
        </>
      )}

      {editing && (
        <CustomListEditor listId={editing.id} onClose={() => setEditing(null)} />
      )}
    </div>
  );
};
