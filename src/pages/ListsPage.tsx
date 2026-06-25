import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { GripVertical, PartyPopper, Plus, Upload, Check, Pencil, Trash2 } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useAppStore } from '../store';
import { SectionHeader } from '../components/SectionHeader';
import { SortableUnifiedListCard } from '../components/SortableUnifiedListCard';
import { UnifiedListCard } from '../components/UnifiedListCard';
import { CustomListEditor } from '../components/CustomListEditor';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Drawer } from '../components/Drawer';
import { downloadExport, parseImport } from '../lib/listIO';
import { safeLS } from '../lib/safeStorage';
import type { List, ListExportFile, MultiProfileExportFile } from '../types';

type SectionsOpen = { workbench: boolean; custom: boolean; completati: boolean };

export type ListsPageHandle = {
  openProfiles: () => void;
  createList: () => void;
  openExport: () => void;
  triggerImport: () => void;
};

export const ListsPage = forwardRef<ListsPageHandle, { onOpenDetail: (listId: string) => void }>(
  ({ onOpenDetail }, ref) => {
  const store = useAppStore();
  const [showProfiles, setShowProfiles] = useState(false);
  const [movePromptId, setMovePromptId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id?: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPending, setImportPending] = useState<ListExportFile | MultiProfileExportFile | null>(null);
  const [importSelectedIds, setImportSelectedIds] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState<Set<string>>(new Set());
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

  const [editingProfile, setEditingProfile] = useState<{ id: string; name: string } | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLists = store.getActiveLists();
  const maxedLists = store.getMaxedLists();
  const movePromptList = maxedLists.find(list => list.id === movePromptId);

  const activeWorkbenches = activeLists.filter(l => !l.custom);
  const activeCustom = activeLists.filter(l => l.custom);

  const availableUpgrades = store.getAvailableUpgrades();
  const refinerLevel = store.getRefinerLevel();
  const totalRequired = store.getTotalRequiredMaterials();

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

  const openExportModal = () => {
    setExportSelectedIds(new Set(store.profiles.map(p => p.id)));
    setShowExportModal(true);
  };

  const handleExportAll = () => {
    const { sharedLists, profiles } = store.buildExportData(store.profiles.map(p => p.id));
    downloadExport({ version: 3, exportedAt: new Date().toISOString(), sharedLists, profiles });
  };

  const handleExportSelected = () => {
    const ids = [...exportSelectedIds];
    if (ids.length === 0) return;
    const { sharedLists, profiles } = store.buildExportData(ids);
    downloadExport({ version: 3, exportedAt: new Date().toISOString(), sharedLists, profiles });
    setShowExportModal(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = parseImport(ev.target?.result as string);
        setImportPending(data);
        if (data.version === 3) {
          setImportSelectedIds(new Set(data.profiles.map(p => p.profile.id)));
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Errore durante l\'importazione');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!importPending) return;
    if (importPending.version === 3) {
      store.importMultiProfile(importPending, [...importSelectedIds]);
    } else {
      store.importLists(importPending);
    }
    setImportPending(null);
    setImportSelectedIds(new Set());
    setImportError(null);
  };

  const closeProfilesDrawer = () => {
    setShowProfiles(false);
    setEditingProfile(null);
    setDeletingProfileId(null);
    setShowNewProfile(false);
    setNewProfileName('');
  };

  const commitNewProfile = () => {
    const name = newProfileName.trim();
    if (!name) return;
    store.createProfile(name);
    setShowNewProfile(false);
    setNewProfileName('');
    closeProfilesDrawer();
  };

  const commitRenameProfile = () => {
    if (!editingProfile) return;
    const name = editingProfile.name.trim();
    if (name) store.renameProfile(editingProfile.id, name);
    setEditingProfile(null);
  };

  useImperativeHandle(ref, () => ({
    openProfiles: () => setShowProfiles(true),
    createList: () => setEditing({}),
    openExport: openExportModal,
    triggerImport: () => fileInputRef.current?.click(),
  }));

  const sharedCardProps = (list: List) => ({
    list,
    current: store.hideoutLevels[list.id] ?? 0,
    isActive: store.activeModules[list.id],
    inventory: store.inventory,
    otherNeeds: store.getTotalRequiredMaterials(list.id),
    selectedTargets: store.targetLevels[list.id] ?? [],
    checkedActions: store.checkedActions,
    itemsInfo: store.itemsInfo,
    refinerLevel,
    totalRequired,
    canUpgrade: availableUpgrades.includes(list.id),
    onUpgrade: () => store.upgradeModule(list.id),
    onToggle: () => store.toggleModuleActive(list.id),
    onCurrentLevel: handleCurrentLevel(list.id, list.maxLevel),
    onToggleTarget: (level: number) => store.toggleTargetLevel(list.id, level),
    onToggleAction: (level: number, actionId: string) => store.toggleAction(list.id, level, actionId),
    onOpenDetail: () => onOpenDetail(list.id),
    onEdit: list.custom ? () => setEditing({ id: list.id }) : undefined,
    onDelete: list.custom ? () => store.deleteCustomList(list.id) : undefined,
  });

  const renderDndSection = (lists: List[]) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={lists.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {lists.map(list => (
          <SortableUnifiedListCard key={list.id} {...sharedCardProps(list)} />
        ))}
      </SortableContext>
    </DndContext>
  );

  return (
    <div className="pb-28">
      {/* Sticky header */}
      <div className="px-4 pt-4 pb-3 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <SectionHeader title="Liste" />
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
              Nessuna lista personalizzata. Creane una con "+ Lista" nel menu.
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
              <UnifiedListCard key={list.id} {...sharedCardProps(list)} />
            ))}
          </CollapsibleSection>
        )}
      </div>

      {editing && (
        <CustomListEditor listId={editing.id} onClose={() => setEditing(null)} />
      )}

      {/* Profili drawer */}
      {showProfiles && (
        <Drawer from="top" title="Profili" onClose={closeProfilesDrawer}>
          <div className="space-y-1.5 pt-1">
            {store.profiles.map(profile => {
              const isActive = profile.id === store.activeProfileId;
              const isDeleting = deletingProfileId === profile.id;
              const isEditing = editingProfile?.id === profile.id;

              return (
                <div key={profile.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isActive ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
                    onClick={() => { if (!isEditing && !isDeleting && !isActive) { store.switchProfile(profile.id); closeProfilesDrawer(); } }}>
                    {isActive && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>

                  {isEditing ? (
                    <input
                      autoFocus
                      className="flex-1 text-sm font-semibold bg-white dark:bg-gray-700 border border-blue-400 rounded-xl px-2 py-1 focus:outline-none"
                      value={editingProfile.name}
                      onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') commitRenameProfile(); if (e.key === 'Escape') setEditingProfile(null); }}
                    />
                  ) : (
                    <span
                      className={`flex-1 text-sm font-semibold truncate cursor-pointer ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}
                      onClick={() => { if (!isDeleting && !isActive) { store.switchProfile(profile.id); closeProfilesDrawer(); } }}
                    >
                      {profile.name}
                    </span>
                  )}

                  {isEditing ? (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={commitRenameProfile}
                        className="px-2.5 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">OK</button>
                      <button onClick={() => setEditingProfile(null)}
                        className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">✕</button>
                    </div>
                  ) : isDeleting ? (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { store.deleteProfile(profile.id); setDeletingProfileId(null); }}
                        className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">Elimina</button>
                      <button onClick={() => setDeletingProfileId(null)}
                        className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingProfile({ id: profile.id, name: profile.name }); setDeletingProfileId(null); }}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => { setDeletingProfileId(profile.id); setEditingProfile(null); }}
                        disabled={store.profiles.length <= 1}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              {showNewProfile ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 border border-blue-400 rounded-xl px-3 py-2 focus:outline-none"
                    placeholder="Nome profilo…"
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitNewProfile(); if (e.key === 'Escape') { setShowNewProfile(false); setNewProfileName(''); } }}
                  />
                  <button onClick={commitNewProfile}
                    className="px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl">OK</button>
                  <button onClick={() => { setShowNewProfile(false); setNewProfileName(''); }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs rounded-xl">✕</button>
                </div>
              ) : (
                <button onClick={() => { setShowNewProfile(true); setEditingProfile(null); setDeletingProfileId(null); }}
                  className="w-full flex items-center gap-2 p-3 text-blue-500 font-bold text-sm rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <Plus size={15} />
                  Nuovo profilo
                </button>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* Import confirmation modal */}
      {importPending && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6"
          onClick={() => { setImportPending(null); setImportSelectedIds(new Set()); }}>
          <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 w-full max-w-sm max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-2 shrink-0">Importa liste</h3>

            {importPending.version === 3 ? (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Seleziona i profili da importare:</p>
                <button
                  onClick={() => {
                    const allIds = importPending.profiles.map(e => e.profile.id);
                    setImportSelectedIds(importSelectedIds.size === allIds.length ? new Set() : new Set(allIds));
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-left"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${importSelectedIds.size === importPending.profiles.length ? 'bg-blue-500 border-blue-500' : importSelectedIds.size > 0 ? 'border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}>
                    {importSelectedIds.size === importPending.profiles.length
                      ? <Check size={12} className="text-white" strokeWidth={3} />
                      : importSelectedIds.size > 0
                        ? <div className="w-2.5 h-0.5 bg-blue-500 rounded-full" />
                        : null}
                  </div>
                  <span className="text-sm font-semibold">Tutti i profili</span>
                </button>

                {importPending.profiles.map(entry => {
                  const selected = importSelectedIds.has(entry.profile.id);
                  const existsLocally = store.profiles.some(p => p.id === entry.profile.id);
                  return (
                    <button key={entry.profile.id}
                      onClick={() => {
                        const next = new Set(importSelectedIds);
                        if (selected) next.delete(entry.profile.id); else next.add(entry.profile.id);
                        setImportSelectedIds(next);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 ml-4 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{entry.profile.name}</p>
                        <p className={`text-[10px] font-semibold ${existsLocally ? 'text-amber-500' : 'text-blue-500'}`}>
                          {existsLocally ? 'Sovrascrive profilo esistente' : 'Nuovo profilo'}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {importPending.sharedLists.length > 0 && (
                  <p className="text-[11px] text-gray-400 px-1 pt-1">
                    {importPending.sharedLists.length} {importPending.sharedLists.length === 1 ? 'lista condivisa verrà aggiornata' : 'liste condivise verranno aggiornate'}.
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-3 shrink-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Stai per importare <strong>{importPending.lists.length}</strong> liste. Le liste con lo stesso ID verranno sovrascritte.
                </p>
                {importPending.inventory && (
                  <p className="text-[11px] text-blue-500">Il file include anche l'inventario, che verrà ripristinato.</p>
                )}
              </div>
            )}

            <div className="space-y-2 shrink-0">
              <button onClick={handleExportAll}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-left">
                <Upload size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Esporta backup prima</p>
                  <p className="text-[11px] text-gray-400">Salva tutti i tuoi profili attuali</p>
                </div>
              </button>
              <button onClick={confirmImport}
                disabled={importPending.version === 3 && importSelectedIds.size === 0}
                className="w-full py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl disabled:opacity-40">
                Importa{importPending.version === 3 && importSelectedIds.size > 0 ? ` (${importSelectedIds.size})` : ''}
              </button>
              <button onClick={() => { setImportPending(null); setImportSelectedIds(new Set()); }}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-2xl">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export profile selection modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6"
          onClick={() => setShowExportModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-3">Esporta liste</h3>

            <button
              onClick={() => {
                const allIds = store.profiles.map(p => p.id);
                setExportSelectedIds(exportSelectedIds.size === allIds.length ? new Set() : new Set(allIds));
              }}
              className="w-full flex items-center gap-3 p-3 mb-1 bg-gray-50 dark:bg-gray-800 rounded-2xl text-left"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${exportSelectedIds.size === store.profiles.length ? 'bg-blue-500 border-blue-500' : exportSelectedIds.size > 0 ? 'border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}>
                {exportSelectedIds.size === store.profiles.length
                  ? <Check size={12} className="text-white" strokeWidth={3} />
                  : exportSelectedIds.size > 0
                    ? <div className="w-2.5 h-0.5 bg-blue-500 rounded-full" />
                    : null}
              </div>
              <span className="text-sm font-semibold">Tutti i profili</span>
            </button>

            <div className="space-y-0.5 ml-4 mb-4">
              {store.profiles.map(profile => {
                const selected = exportSelectedIds.has(profile.id);
                return (
                  <button key={profile.id}
                    onClick={() => {
                      const next = new Set(exportSelectedIds);
                      if (selected) next.delete(profile.id); else next.add(profile.id);
                      setExportSelectedIds(next);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm flex-1 truncate">{profile.name}</span>
                    {profile.id === store.activeProfileId && (
                      <span className="text-[10px] text-blue-500 font-bold shrink-0">Attivo</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <button onClick={handleExportSelected} disabled={exportSelectedIds.size === 0}
                className="w-full py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl disabled:opacity-40">
                Esporta{exportSelectedIds.size > 0 ? ` (${exportSelectedIds.size} profil${exportSelectedIds.size === 1 ? 'o' : 'i'})` : ''}
              </button>
              <button onClick={() => setShowExportModal(false)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-2xl">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
