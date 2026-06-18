import { useState, useRef } from 'react';
import { RotateCcw, GripVertical, PartyPopper, Plus, Download, Upload, ChevronUp } from 'lucide-react';
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
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Drawer } from '../components/Drawer';
import { buildExport, downloadExport, parseImport } from '../lib/listIO';
import { safeLS } from '../lib/safeStorage';
import type { List, ListExportFile } from '../types';

type SectionsOpen = { workbench: boolean; custom: boolean; completati: boolean };

export const GoalsPage = ({ onOpenDatabase, onOpenDetail }: {
  onOpenDatabase: () => void;
  onOpenDetail: (listId: string) => void;
}) => {
  const store = useAppStore();
  const [showActions, setShowActions] = useState(false);
  const [drawerConfirmReset, setDrawerConfirmReset] = useState(false);
  const [movePromptId, setMovePromptId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id?: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPending, setImportPending] = useState<ListExportFile | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState<SectionsOpen>(() =>
    safeLS(() => {
      const raw = localStorage.getItem('goals-sections');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SectionsOpen>;
        return { workbench: true, custom: true, completati: false, ...parsed };
      }
      return { workbench: true, custom: true, completati: false };
    }, { workbench: true, custom: true, completati: false })
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orderedLists = store.getOrderedLists();
  const activeLists = orderedLists.filter(list => (store.hideoutLevels[list.id] ?? 0) < list.maxLevel);
  const maxedLists = orderedLists.filter(list => (store.hideoutLevels[list.id] ?? 0) >= list.maxLevel);
  const movePromptList = maxedLists.find(list => list.id === movePromptId);

  const activeWorkbenches = activeLists.filter(l => !l.custom);
  const activeCustom = activeLists.filter(l => l.custom);

  const toggleSection = (key: keyof SectionsOpen) => {
    const next = { ...sectionsOpen, [key]: !sectionsOpen[key] };
    setSectionsOpen(next);
    safeLS(() => localStorage.setItem('goals-sections', JSON.stringify(next)), undefined);
  };

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
    const data = buildExport(store.getAllLists(), store.hideoutLevels, store.targetLevels, store.activeModules);
    downloadExport(data);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = parseImport(ev.target?.result as string);
        setImportPending(data);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Errore durante l\'importazione');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!importPending) return;
    store.importLists(importPending);
    setImportPending(null);
    setImportError(null);
  };

  const renderDndSection = (lists: List[]) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={lists.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {lists.map(list => (
          <SortableListRow key={list.id} list={list}
            current={store.hideoutLevels[list.id] ?? 0}
            selectedTargets={store.targetLevels[list.id] ?? []}
            isActive={store.activeModules[list.id]}
            inventory={store.inventory}
            otherNeeds={store.getTotalRequiredMaterials(list.id)}
            checkedActions={store.checkedActions}
            onToggle={() => store.toggleModuleActive(list.id)}
            onCurrentLevel={handleCurrentLevel(list.id, list.maxLevel)}
            onToggleTarget={level => store.toggleTargetLevel(list.id, level)}
            onToggleAction={(level, actionId) => store.toggleAction(list.id, level, actionId)}
            onOpenDetail={() => onOpenDetail(list.id)}
            onEdit={list.custom ? () => setEditing({ id: list.id }) : undefined}
          />
        ))}
      </SortableContext>
    </DndContext>
  );

  return (
    <div className="pb-28">
      {/* Sticky header — two rows */}
      <div className="px-4 pt-4 pb-3 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <SectionHeader title="Obiettivi" onOpenDatabase={onOpenDatabase} />
        <div className="flex justify-between items-center mt-2">
          <button onClick={() => setEditing({})}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">
            <Plus size={13} />
            Lista
          </button>
          <button onClick={() => setShowActions(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold rounded-full">
            <ChevronUp size={13} />
            Azioni
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />

      <div className="p-4">
        {importError && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between gap-2">
            <p className="text-[11px] text-red-600 dark:text-red-400">{importError}</p>
            <button onClick={() => setImportError(null)}
              className="text-[11px] text-red-500 font-bold shrink-0">✕</button>
          </div>
        )}

        <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
          <GripVertical size={13} />
          Trascina per cambiare la priorità di visualizzazione
        </p>

        <CollapsibleSection
          title="Banchi da lavoro"
          count={activeWorkbenches.length}
          open={sectionsOpen.workbench}
          onToggle={() => toggleSection('workbench')}
        >
          {renderDndSection(activeWorkbenches)}
        </CollapsibleSection>

        <CollapsibleSection
          title="Liste personalizzate"
          count={activeCustom.length}
          open={sectionsOpen.custom}
          onToggle={() => toggleSection('custom')}
        >
          {activeCustom.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic px-1 pb-2">
              Nessuna lista personalizzata. Creane una con "+ Lista".
            </p>
          ) : renderDndSection(activeCustom)}
        </CollapsibleSection>

        {maxedLists.length > 0 && (
          <CollapsibleSection
            title="Completati"
            count={maxedLists.length}
            open={sectionsOpen.completati}
            onToggle={() => toggleSection('completati')}
          >
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
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-full">
                    No, lascia
                  </button>
                </div>
              </div>
            )}
            {maxedLists.map(list => (
              <ListRow key={list.id} list={list}
                current={store.hideoutLevels[list.id] ?? 0}
                selectedTargets={store.targetLevels[list.id] ?? []}
                isActive={store.activeModules[list.id]}
                inventory={store.inventory}
                otherNeeds={store.getTotalRequiredMaterials(list.id)}
                checkedActions={store.checkedActions}
                onToggle={() => store.toggleModuleActive(list.id)}
                onCurrentLevel={handleCurrentLevel(list.id, list.maxLevel)}
                onToggleTarget={level => store.toggleTargetLevel(list.id, level)}
                onToggleAction={(level, actionId) => store.toggleAction(list.id, level, actionId)}
                onOpenDetail={() => onOpenDetail(list.id)}
                onEdit={list.custom ? () => setEditing({ id: list.id }) : undefined}
              />
            ))}
          </CollapsibleSection>
        )}
      </div>

      {editing && (
        <CustomListEditor listId={editing.id} onClose={() => setEditing(null)} />
      )}

      {/* Azioni drawer */}
      {showActions && (
        <Drawer from="top" title="Azioni"
          onClose={() => { setShowActions(false); setDrawerConfirmReset(false); }}
        >
          {drawerConfirmReset ? (
            <div className="space-y-3 pt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Verranno azzerati tutti i progressi (livelli, inventario, azioni). Le liste personalizzate rimangono. Questa azione è irreversibile.
              </p>
              <button
                onClick={() => { store.resetProgress(); setShowActions(false); setDrawerConfirmReset(false); }}
                className="w-full py-3 bg-red-500 text-white font-bold text-sm rounded-2xl"
              >
                Conferma ripristino
              </button>
              <button
                onClick={() => setDrawerConfirmReset(false)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-2xl"
              >
                Annulla
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => { handleExport(); setShowActions(false); }}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-left active:scale-[0.98] transition-transform"
              >
                <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shrink-0">
                  <Upload size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-bold text-sm">Esporta liste</p>
                  <p className="text-[11px] text-gray-400">Scarica un backup JSON</p>
                </div>
              </button>
              <button
                onClick={() => { fileInputRef.current?.click(); setShowActions(false); }}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-left active:scale-[0.98] transition-transform"
              >
                <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shrink-0">
                  <Download size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-bold text-sm">Importa liste</p>
                  <p className="text-[11px] text-gray-400">Carica da file JSON</p>
                </div>
              </button>
              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
              <button
                onClick={() => setDrawerConfirmReset(true)}
                className="w-full flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-left active:scale-[0.98] transition-transform"
              >
                <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shrink-0">
                  <RotateCcw size={16} className="text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-sm text-red-500">Ripristina progressi</p>
                  <p className="text-[11px] text-gray-400">Azzera livelli e inventario</p>
                </div>
              </button>
            </div>
          )}
        </Drawer>
      )}

      {/* Import confirmation modal */}
      {importPending && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6"
          onClick={() => setImportPending(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-1">Importa liste</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Stai per importare <strong>{importPending.lists.length}</strong> liste. Le liste con lo stesso ID verranno sovrascritte.
            </p>
            <div className="space-y-2">
              <button onClick={handleExport}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-left">
                <Upload size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Esporta backup prima</p>
                  <p className="text-[11px] text-gray-400">Salva le tue liste attuali</p>
                </div>
              </button>
              <button onClick={confirmImport}
                className="w-full py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl">
                Importa comunque
              </button>
              <button onClick={() => setImportPending(null)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-2xl">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
