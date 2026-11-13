import { useState, useRef, useEffect, useMemo } from 'react';
import { GripVertical, Upload, Check, Eye, EyeOff } from 'lucide-react';
import {
  DndContext, closestCenter, MeasuringStrategy, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection, DragEndEvent, DragStartEvent, Modifier, UniqueIdentifier } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '@/store';
import {
  getAllListsPure,
  getOrderedListsPure,
  getActiveListsPure,
  getMaxedListsPure,
  getAvailableUpgradesPure,
  getRefinerLevelPure,
  getTotalRequiredMaterialsPure,
  getOtherNeedsPure,
  isListExpired,
} from '@/store/selectors';
import { REFINER_ID } from '@/store/gameData';
import { SectionHeader } from '@/components/SectionHeader';
import { SortableUnifiedListCard } from '@/components/SortableUnifiedListCard';
import { UnifiedListCard } from '@/components/UnifiedListCard';
import { CustomListEditor } from '@/components/CustomListEditor';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ProfilesDrawer } from '@/components/ProfilesDrawer';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useTranslation, getListName } from '@/i18n';
import { downloadExport, parseImport } from '@/lib/listIO';
import { v } from '@/lib/validate';
import { cascadeEffects, describeRequirements, levelBlocker } from '@/lib/levelRequirements';
import { safeLS } from '@/lib/safeStorage';
import { isSectionActive } from '@/lib/sections';
import type { List, ListExportFile, MultiProfileExportFile } from '@/types';
import { StickyHeader } from '@/components/StickyHeader';

type SectionKey = 'workbench' | 'project' | 'custom' | 'completati';
type SectionsOpen = Record<SectionKey, boolean>;

/** Per-section visibility + expired filter. Persisted view preference, not gameplay state. */
type ViewPrefs = Record<`show_${SectionKey}`, boolean> & { hideExpired: boolean };

const DEFAULT_VIEW_PREFS: ViewPrefs = {
  show_workbench: true,
  show_project: true,
  show_custom: true,
  show_completati: true,
  hideExpired: true,
};

const SECTION_KEYS: SectionKey[] = ['workbench', 'project', 'custom', 'completati'];

export type ListsPageAction = 'create' | 'export' | 'import' | null;

type ListsPageProps = {
  onOpenDetail: (listId: string) => void;
  action?: ListsPageAction;
  onActionHandled?: () => void;
};

export const ListsPage = ({ onOpenDetail, action, onActionHandled }: ListsPageProps) => {
  const { t, language } = useTranslation();
  // Selettori mirati — re-render solo sulla slice pertinente
  const inventory = useAppStore(s => s.inventory);
  const currentLevels = useAppStore(s => s.currentLevels);
  const targetLevels = useAppStore(s => s.targetLevels);
  const activeModules = useAppStore(s => s.activeModules);
  const checkedActions = useAppStore(s => s.checkedActions);

  const { workbenches, customLists, sharedCustomLists, listOrder, itemsInfo, profiles, activeProfileId } = useAppStore(
    useShallow(s => ({
      workbenches: s.workbenches,
      customLists: s.customLists,
      sharedCustomLists: s.sharedCustomLists,
      listOrder: s.listOrder,
      itemsInfo: s.itemsInfo,
      profiles: s.profiles,
      activeProfileId: s.activeProfileId,
    })),
  );
  const isProjectsActive = useAppStore(s => isSectionActive('projects', s));
  const rawProjects = useAppStore(s => s.projects);
  const projects = useMemo(() => isProjectsActive ? rawProjects : [], [isProjectsActive, rawProjects]);

  // Action refs — reference-stabili, non causano re-render
  const setListOrder = useAppStore(s => s.setListOrder);
  const setModuleCurrentLevel = useAppStore(s => s.setModuleCurrentLevel);
  const toggleModuleActive = useAppStore(s => s.toggleModuleActive);
  const upgradeModule = useAppStore(s => s.upgradeModule);
  const toggleTargetLevel = useAppStore(s => s.toggleTargetLevel);
  const toggleAction = useAppStore(s => s.toggleAction);
  const deleteCustomList = useAppStore(s => s.deleteCustomList);
  const buildExportData = useAppStore(s => s.buildExportData);
  const importMultiProfile = useAppStore(s => s.importMultiProfile);
  const importLists = useAppStore(s => s.importLists);

  const [showProfiles, setShowProfiles] = useState(false);
  const [editing, setEditing] = useState<{ id?: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPending, setImportPending] = useState<ListExportFile | MultiProfileExportFile | null>(null);
  const [importSelectedIds, setImportSelectedIds] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState<Set<string>>(new Set());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [peekGhosts, setPeekGhosts] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState<SectionsOpen>(() => {
    const fallback: SectionsOpen = { workbench: true, project: true, custom: true, completati: false };
    const SectionsSchema = v.object({
      workbench:  v.boolean(),
      project:    v.boolean(),
      custom:     v.boolean(),
      completati: v.boolean(),
    });
    return safeLS(() => {
      const raw = localStorage.getItem('goals-sections');
      if (raw) return SectionsSchema.parse({ ...fallback, ...JSON.parse(raw) }, fallback);
      return fallback;
    }, fallback);
  });

  const [viewPrefs, setViewPrefs] = useState<ViewPrefs>(() => {
    const ViewSchema = v.object({
      show_workbench:  v.boolean(),
      show_project:    v.boolean(),
      show_custom:     v.boolean(),
      show_completati: v.boolean(),
      hideExpired:     v.boolean(),
    });
    return safeLS(() => {
      const raw = localStorage.getItem('goals-view-v1');
      if (raw) return ViewSchema.parse(JSON.parse(raw), DEFAULT_VIEW_PREFS);
      return DEFAULT_VIEW_PREFS;
    }, DEFAULT_VIEW_PREFS);
  });

  const patchViewPrefs = (patch: Partial<ViewPrefs>) => {
    const next = { ...viewPrefs, ...patch };
    setViewPrefs(next);
    safeLS(() => localStorage.setItem('goals-view-v1', JSON.stringify(next)), undefined);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const preDragTopRef = useRef<number | null>(null);
  const postDragTopRef = useRef<number | null>(null);

  useScrollLock(Boolean(importPending || showExportModal));

  const allLists = useMemo(
    () => getAllListsPure(workbenches, projects, sharedCustomLists, customLists),
    [workbenches, projects, sharedCustomLists, customLists],
  );
  const projectIds = useMemo(() => new Set(projects.map(p => p.id)), [projects]);
  const orderedLists = useMemo(
    () => getOrderedListsPure(allLists, listOrder),
    [allLists, listOrder],
  );
  const activeLists = useMemo(
    () => getActiveListsPure(orderedLists, currentLevels),
    [orderedLists, currentLevels],
  );
  const maxedLists = useMemo(
    () => getMaxedListsPure(orderedLists, currentLevels),
    [orderedLists, currentLevels],
  );
  const availableUpgrades = useMemo(
    () => getAvailableUpgradesPure(allLists, activeModules, currentLevels, inventory, undefined, checkedActions),
    [allLists, activeModules, currentLevels, inventory, checkedActions],
  );
  const refinerLevel = useMemo(
    () => getRefinerLevelPure(currentLevels, REFINER_ID),
    [currentLevels],
  );
  const totalRequired = useMemo(
    () => getTotalRequiredMaterialsPure(allLists, activeModules, currentLevels, targetLevels),
    [allLists, activeModules, currentLevels, targetLevels],
  );

  const keepByExpiry = useMemo(
    () => (l: List) => !viewPrefs.hideExpired || !isListExpired(l),
    [viewPrefs.hideExpired],
  );

  const activeWorkbenches = activeLists.filter(l => !l.custom && !projectIds.has(l.id) && keepByExpiry(l));
  const activeProjects = activeLists.filter(l => projectIds.has(l.id) && keepByExpiry(l));
  const activeCustom = activeLists.filter(l => l.custom && keepByExpiry(l));
  const activePriorityLists = useMemo(() => activeLists.filter(keepByExpiry), [activeLists, keepByExpiry]);
  const visibleMaxedLists = maxedLists.filter(keepByExpiry);

  const isListFilteredOut = (list: List): boolean => {
    if (list.custom) return !viewPrefs.show_custom;
    if (projectIds.has(list.id)) return !viewPrefs.show_project;
    return !viewPrefs.show_workbench;
  };

  const hiddenActiveCount = activePriorityLists.filter(isListFilteredOut).length;
  const visibleActiveCount = activePriorityLists.length - hiddenActiveCount;

  const sectionCounts: Record<SectionKey, number> = {
    workbench: activeWorkbenches.length,
    project: activeProjects.length,
    custom: activeCustom.length,
    completati: visibleMaxedLists.length,
  };

  const toggleSection = (key: keyof SectionsOpen) => {
    const next = { ...sectionsOpen, [key]: !sectionsOpen[key] };
    setSectionsOpen(next);
    safeLS(() => localStorage.setItem('goals-sections', JSON.stringify(next)), undefined);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const el = document.querySelector<HTMLElement>(`[data-sortable-id="${CSS.escape(id)}"]`);
    preDragTopRef.current = el ? el.getBoundingClientRect().top : null;
    postDragTopRef.current = null;
    setActiveDragId(id);
  };

  const handleDragCancel = () => {
    preDragTopRef.current = null;
    postDragTopRef.current = null;
    setActiveDragId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    preDragTopRef.current = null;
    postDragTopRef.current = null;
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentOrderIds = orderedLists.map(l => l.id);
    const fullOrder = [
      ...currentOrderIds,
      ...listOrder.filter(id => !currentOrderIds.includes(id)),
    ];
    const oldIndex = fullOrder.indexOf(active.id as string);
    const newIndex = fullOrder.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) {
      setListOrder(arrayMove(fullOrder, oldIndex, newIndex));
    }
  };

  const handleCurrentLevel = (listId: string, maxLevel: number) => (v: number, deduct: boolean) => {
    setModuleCurrentLevel(listId, v, deduct);
    if (v >= maxLevel) {
      setListOrder([...listOrder.filter(id => id !== listId), listId]);
    }
  };

  const handleExportAll = () => {
    const { sharedLists, profiles: exported } = buildExportData(profiles.map(p => p.id));
    downloadExport({ version: 3, exportedAt: new Date().toISOString(), sharedLists, profiles: exported });
  };

  const handleExportSelected = () => {
    const ids = [...exportSelectedIds];
    if (ids.length === 0) return;
    const { sharedLists, profiles: exported } = buildExportData(ids);
    downloadExport({ version: 3, exportedAt: new Date().toISOString(), sharedLists, profiles: exported });
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
      importMultiProfile(importPending, [...importSelectedIds]);
    } else {
      importLists(importPending);
    }
    setImportPending(null);
    setImportSelectedIds(new Set());
    setImportError(null);
  };

  useEffect(() => {
    if (!action) return;
    const timer = setTimeout(() => {
      if (action === 'create') {
        setEditing({});
      } else if (action === 'export') {
        setExportSelectedIds(new Set(profiles.map(p => p.id)));
        setShowExportModal(true);
      } else if (action === 'import') {
        fileInputRef.current?.click();
      }
      onActionHandled?.();
    }, 0);
    return () => clearTimeout(timer);
  }, [action, onActionHandled, profiles]);

  const listNameOf = (listId: string) => {
    const found = allLists.find(l => l.id === listId);
    return found ? getListName(found, language) : listId;
  };

  const sharedCardProps = (list: List) => ({
    list,
    nextLevelRequirements: describeRequirements(
      list.levels.find(l => l.level === (currentLevels[list.id] ?? 0) + 1)?.requires,
      currentLevels,
      listNameOf,
    ),
    levelBlocker: (level: number) => levelBlocker(list, currentLevels[list.id] ?? 0, level, currentLevels, listNameOf),
    cascadeFor: (level: number) => cascadeEffects(allLists, currentLevels, list.id, level, listNameOf),
    current: currentLevels[list.id] ?? 0,
    isActive: activeModules[list.id],
    inventory,
    otherNeeds: getOtherNeedsPure(totalRequired, list, currentLevels, targetLevels),
    selectedTargets: targetLevels[list.id] ?? [],
    checkedActions,
    itemsInfo,
    refinerLevel,
    totalRequired,
    canUpgrade: availableUpgrades.includes(list.id),
    onUpgrade: () => {
      upgradeModule(list.id);
      const nextLevel = (currentLevels[list.id] ?? 0) + 1;
      if (nextLevel >= list.maxLevel) {
        setListOrder([...listOrder.filter(id => id !== list.id), list.id]);
      }
    },
    onToggle: () => toggleModuleActive(list.id),
    onCurrentLevel: handleCurrentLevel(list.id, list.maxLevel),
    onToggleTarget: (level: number) => toggleTargetLevel(list.id, level),
    onToggleAction: (level: number, actionId: string) => toggleAction(list.id, level, actionId),
    onOpenDetail: () => onOpenDetail(list.id),
    onEdit: list.custom ? () => setEditing({ id: list.id }) : undefined,
    onDelete: list.custom ? () => deleteCustomList(list.id) : undefined,
  });

  const lockToInitialTopModifier: Modifier = ({ transform, activeNodeRect }) => {
    if (!activeNodeRect || preDragTopRef.current === null) {
      return { ...transform, x: 0 };
    }
    if (postDragTopRef.current === null) {
      postDragTopRef.current = activeNodeRect.top;
    }
    const initialShiftY = preDragTopRef.current - postDragTopRef.current;
    return {
      ...transform,
      x: 0,
      y: transform.y + initialShiftY,
    };
  };

  const slotCenterCollision: CollisionDetection = (args) => {
    if (!args.collisionRect) return closestCenter(args);
    const activeHeight = args.collisionRect.height || 58;
    const activeCenterY = args.collisionRect.top + activeHeight / 2;
    const activeIndex = activePriorityLists.findIndex(l => l.id === String(args.active.id));

    let closestId: UniqueIdentifier | null = null;
    let minDistance = Infinity;

    for (const container of args.droppableContainers) {
      if (container.disabled) continue;
      const rect = args.droppableRects.get(container.id);
      if (!rect) continue;
      const itemIndex = activePriorityLists.findIndex(l => l.id === String(container.id));
      const slotHeight = Math.min(activeHeight, rect.height);
      const slotCenterY =
        activeIndex !== -1 && itemIndex > activeIndex
          ? rect.bottom - slotHeight / 2
          : rect.top + slotHeight / 2;
      const dist = Math.abs(activeCenterY - slotCenterY);
      if (dist < minDistance) {
        minDistance = dist;
        closestId = container.id;
      }
    }

    return closestId !== null ? [{ id: closestId }] : closestCenter(args);
  };

  const renderPriorityList = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={slotCenterCollision}
      modifiers={[lockToInitialTopModifier]}
      measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={activePriorityLists.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div data-list-container="benches" className="w-full flex flex-col">
          {activePriorityLists.map((list, index) => (
            <SortableUnifiedListCard
              key={list.id}
              {...sharedCardProps(list)}
              priorityRank={index + 1}
              isFilteredOut={isListFilteredOut(list)}
              showGhost={activeDragId !== null || peekGhosts}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <div className="pb-28 w-full min-w-0">
      {/* Sticky header */}
      <StickyHeader compact>
        <SectionHeader title={t('lists.title')} />
      </StickyHeader>

      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />

      <div className="p-4 w-full min-w-0">
        {importError && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between gap-2">
            <p className="text-[11px] text-red-600 dark:text-red-400">{importError}</p>
            <button onClick={() => setImportError(null)}
              className="text-[11px] text-red-500 font-bold shrink-0">✕</button>
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <GripVertical size={13} />
            {t('benches.prioritize')}
          </p>
          {hiddenActiveCount > 0 && (
            <button
              type="button"
              onClick={() => setPeekGhosts(p => !p)}
              aria-pressed={peekGhosts}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                peekGhosts
                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {peekGhosts ? <Eye size={11} /> : <EyeOff size={11} />}
              {t('lists.hiddenByFilterNotice', { count: hiddenActiveCount })}
            </button>
          )}
        </div>

        {/* Preferenze di vista: mostra/nascondi sezioni + filtro scaduti */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {SECTION_KEYS.map(key => {
            if (key === 'project' && projects.length === 0) return null;
            const shown = viewPrefs[`show_${key}`];
            return (
              <button
                key={key}
                onClick={() => patchViewPrefs({ [`show_${key}`]: !shown } as Partial<ViewPrefs>)}
                aria-pressed={shown}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  shown
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-transparent'
                }`}
              >
                {shown ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>{t(`lists.section_${key}` as 'lists.section_workbench')}</span>
                <span className="text-[10px] opacity-75 tabular-nums">({sectionCounts[key]})</span>
              </button>
            );
          })}
          <button
            onClick={() => patchViewPrefs({ hideExpired: !viewPrefs.hideExpired })}
            aria-pressed={viewPrefs.hideExpired}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
              viewPrefs.hideExpired
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-transparent'
            }`}
          >
            {viewPrefs.hideExpired ? <EyeOff size={12} /> : <Eye size={12} />}
            {t('lists.hideExpired')}
          </button>
        </div>

        {activePriorityLists.length > 0 && renderPriorityList()}

        {visibleActiveCount === 0 && !peekGhosts && activeDragId === null && (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic px-1 py-4 text-center">
            {t('lists.emptyActiveLists')}
          </p>
        )}

        {viewPrefs.show_completati && visibleMaxedLists.length > 0 && (
          <CollapsibleSection
            title={t('lists.sectionCompleted')}
            count={visibleMaxedLists.length}
            open={sectionsOpen.completati}
            onToggle={() => toggleSection('completati')}
          >
            <div data-list-container="benches" className="w-full flex flex-col gap-3">
              {visibleMaxedLists.map(list => (
                <UnifiedListCard key={list.id} {...sharedCardProps(list)} />
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {editing && (
        <CustomListEditor listId={editing.id} onClose={() => setEditing(null)} />
      )}

      {/* Profili drawer */}
      <ProfilesDrawer
        isOpen={showProfiles}
        onClose={() => setShowProfiles(false)}
        from="top"
      />

      {/* Import confirmation modal */}
      {importPending && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6 overscroll-contain touch-none"
          onClick={() => { setImportPending(null); setImportSelectedIds(new Set()); }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('importExport.importTitle')}
            className="bg-white dark:bg-gray-900 rounded-[24px] p-5 w-full max-w-sm max-h-[85dvh] flex flex-col touch-auto"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-2 shrink-0">{t('importExport.importTitle')}</h3>

            {importPending.version === 3 ? (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('importExport.selectProfilesToImport')}</p>
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
                  <span className="text-sm font-semibold">{t('importExport.allProfiles')}</span>
                </button>

                {importPending.profiles.map(entry => {
                  const selected = importSelectedIds.has(entry.profile.id);
                  const existsLocally = profiles.some(p => p.id === entry.profile.id);
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
                          {existsLocally ? t('importExport.overwritesExisting') : t('importExport.newProfile')}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {importPending.sharedLists.length > 0 && (
                  <p className="text-[11px] text-gray-400 px-1 pt-1">
                    {importPending.sharedLists.length === 1
                      ? t('importExport.singleSharedList')
                      : t('importExport.sharedListsCount', { count: importPending.sharedLists.length })}.
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-3 shrink-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {t('importExport.legacyImportPrompt', { count: importPending.lists.length })}
                </p>
                {importPending.inventory && (
                  <p className="text-[11px] text-blue-500">{t('importExport.legacyInventoryIncluded')}</p>
                )}
              </div>
            )}

            <div className="space-y-2 shrink-0">
              <button onClick={handleExportAll}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-left">
                <Upload size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{t('importExport.exportBefore')}</p>
                  <p className="text-[11px] text-gray-400">{t('importExport.exportBeforeDesc')}</p>
                </div>
              </button>
              <button onClick={confirmImport}
                disabled={importPending.version === 3 && importSelectedIds.size === 0}
                className="w-full py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl disabled:opacity-40">
                {importPending.version === 3 && importSelectedIds.size > 0
                  ? t('importExport.importBtnWithCount', { count: importSelectedIds.size })
                  : t('importExport.importBtn')}
              </button>
              <button onClick={() => { setImportPending(null); setImportSelectedIds(new Set()); }}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-2xl">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export profile selection modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6 overscroll-contain touch-none"
          onClick={() => setShowExportModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('importExport.exportTitle')}
            className="bg-white dark:bg-gray-900 rounded-[24px] p-5 w-full max-w-sm touch-auto"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-3">{t('importExport.exportTitle')}</h3>

            <button
              onClick={() => {
                const allIds = profiles.map(p => p.id);
                setExportSelectedIds(exportSelectedIds.size === allIds.length ? new Set() : new Set(allIds));
              }}
              className="w-full flex items-center gap-3 p-3 mb-1 bg-gray-50 dark:bg-gray-800 rounded-2xl text-left"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${exportSelectedIds.size === profiles.length ? 'bg-blue-500 border-blue-500' : exportSelectedIds.size > 0 ? 'border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}>
                {exportSelectedIds.size === profiles.length
                  ? <Check size={12} className="text-white" strokeWidth={3} />
                  : exportSelectedIds.size > 0
                    ? <div className="w-2.5 h-0.5 bg-blue-500 rounded-full" />
                    : null}
              </div>
              <span className="text-sm font-semibold">{t('importExport.allProfiles')}</span>
            </button>

            <div className="space-y-0.5 ml-4 mb-4">
              {profiles.map(profile => {
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
                    {profile.id === activeProfileId && (
                      <span className="text-[10px] text-blue-500 font-bold shrink-0">{t('profiles.active')}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <button onClick={handleExportSelected} disabled={exportSelectedIds.size === 0}
                className="w-full py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl disabled:opacity-40">
                {t('importExport.exportBtn')}
              </button>
              <button onClick={() => setShowExportModal(false)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-2xl">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
