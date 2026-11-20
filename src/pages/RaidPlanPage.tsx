import { useState, useEffect, useMemo } from 'react';
import {
  Radar, Plus, Check, Trash2, PackageCheck, Minus, LayoutGrid, List as ListIcon, Pencil, X
} from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '@/store';
import { useTranslation, getItemName } from '@/i18n';
import { PageLayout } from '@/components/PageLayout';
import { Drawer } from '@/components/Drawer';
import { useSetFloatingNavDock } from '@/context/FloatingNavDockContext';
import { ItemPicker } from '@/components/ItemPicker';
import { ItemQuantityModal } from '@/components/ItemQuantityModal';
import { ActionCheckbox } from '@/components/ActionCheckbox';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { RaidItemCard } from '@/components/RaidItemCard';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { Button, Callout, EmptyState } from '@/components/ui';
import { getAllListsPure, getTotalRequiredMaterialsPure, getActiveExpeditionPure } from '@/store/selectors';
import { computeStashDiffPure } from '@/engine/raidPlan';
import { isSectionActive } from '@/lib/sections';
import type { ItemInfo } from '@/types';

export type RaidPlanPageProps = {
  action?: 'apply' | 'reset' | 'clear' | null;
  onActionHandled?: () => void;
};

export const RaidPlanPage = ({ action, onActionHandled }: RaidPlanPageProps = {}) => {
  const { t, language } = useTranslation();

  // Selettori dallo store Zustand
  const raidPlan = useAppStore(s => s.raidPlan);
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const addRaidAction = useAppStore(s => s.addRaidAction);
  const toggleRaidAction = useAppStore(s => s.toggleRaidAction);
  const removeRaidAction = useAppStore(s => s.removeRaidAction);
  const addRaidItem = useAppStore(s => s.addRaidItem);
  const updateRaidItemFound = useAppStore(s => s.updateRaidItemFound);
  const setRaidItemFoundQuantity = useAppStore(s => s.setRaidItemFoundQuantity);
  const setRaidItemFoundAll = useAppStore(s => s.setRaidItemFoundAll);
  const updateRaidItemTarget = useAppStore(s => s.updateRaidItemTarget);
  const replaceRaidItem = useAppStore(s => s.replaceRaidItem);
  const removeRaidItem = useAppStore(s => s.removeRaidItem);
  const applyRaidPlanToStash = useAppStore(s => s.applyRaidPlanToStash);
  const resetRaidPlanProgress = useAppStore(s => s.resetRaidPlanProgress);
  const clearRaidPlan = useAppStore(s => s.clearRaidPlan);
  const setRaidPreferredViewMode = useAppStore(s => s.setRaidPreferredViewMode);
  const ignoreStashDiff = useAppStore(s => s.ignoreStashDiff);
  const syncRaidWithStash = useAppStore(s => s.syncRaidWithStash);

  // Stato e calcolo fabbisogno globale dello Stash per contesto raid
  const inventory = useAppStore(s => s.inventory);
  const currentLevels = useAppStore(s => s.currentLevels);
  const targetLevels = useAppStore(s => s.targetLevels);
  const activeModules = useAppStore(s => s.activeModules);
  const checkedActions = useAppStore(s => s.checkedActions);
  const isProjectsActive = useAppStore(s => isSectionActive('projects', s));
  const isExpeditionsActive = useAppStore(s => isSectionActive('expeditions', s));

  const { workbenches, rawProjects, customLists, sharedCustomLists, expeditions, completedExpeditionsCount } = useAppStore(
    useShallow(s => ({
      workbenches: s.workbenches,
      rawProjects: s.projects,
      customLists: s.customLists,
      sharedCustomLists: s.sharedCustomLists,
      expeditions: s.expeditions,
      completedExpeditionsCount: s.completedExpeditionsCount,
    })),
  );

  const projects = useMemo(() => isProjectsActive ? rawProjects : [], [isProjectsActive, rawProjects]);

  const activeExpedition = useMemo(
    () => isExpeditionsActive ? getActiveExpeditionPure(expeditions, completedExpeditionsCount) : undefined,
    [expeditions, completedExpeditionsCount, isExpeditionsActive],
  );

  const allLists = useMemo(
    () => getAllListsPure(workbenches, projects, sharedCustomLists, customLists, activeExpedition),
    [workbenches, projects, sharedCustomLists, customLists, activeExpedition],
  );

  const totalMaterials = useMemo(
    () => getTotalRequiredMaterialsPure(
      allLists,
      activeModules,
      currentLevels,
      targetLevels,
      undefined,
      Date.now(),
      checkedActions,
    ),
    [allLists, activeModules, currentLevels, targetLevels, checkedActions],
  );

  // Stato locale
  const [newActionText, setNewActionText] = useState('');
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [drawerShowPicker, setDrawerShowPicker] = useState(false);
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
  const [quantityModalItem, setQuantityModalItem] = useState<{
    item: ItemInfo;
    initialQty: number;
    existingPlanItemId?: string;
  } | null>(null);
  const [modalType, setModalType] = useState<'apply' | 'reset' | 'clear' | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Ascolta le azioni contestuali provenienti dal FloatingNav (...)
  useEffect(() => {
    if (action) {
      setModalType(action);
      onActionHandled?.();
    }
  }, [action, onActionHandled]);

  const actions = raidPlan.actions;
  const items = raidPlan.items;
  const isEmpty = actions.length === 0 && items.length === 0;
  const preferredViewMode = raidPlan.preferredViewMode ?? 'grid';
  const activeViewMode = preferredViewMode;
  const isRaidRunning = false;

  const canApplyToStash = useMemo(
    () => items.some(i => i.foundQuantity > 0 && (i.fromStash || (totalMaterials[i.itemId] ?? 0) > 0)),
    [items, totalMaterials],
  );

  const selectedCount = selectedActionIds.size + selectedItemIds.size;

  const handleBatchDelete = () => {
    for (const id of selectedActionIds) {
      removeRaidAction(id);
    }
    for (const id of selectedItemIds) {
      removeRaidItem(id);
    }
    setSelectedActionIds(new Set());
    setSelectedItemIds(new Set());
    if (
      actions.every(a => selectedActionIds.has(a.id)) &&
      items.every(i => selectedItemIds.has(i.id))
    ) {
      setIsEditingRequirements(false);
    }
  };

  const dockConfig = useMemo(() => {
    if (isEditingRequirements) {
      return {
        primary: {
          label: t('common.done') || 'Fine',
          icon: <Check size={16} />,
          onClick: () => {
            setIsEditingRequirements(false);
            setSelectedActionIds(new Set());
            setSelectedItemIds(new Set());
          },
          variant: 'primary' as const,
        },
        secondary: [
          ...(selectedCount > 0
            ? [
                {
                  id: 'raid-batch-delete',
                  icon: <Trash2 size={18} />,
                  label: t('common.delete'),
                  onClick: handleBatchDelete,
                  variant: 'danger' as const,
                },
              ]
            : []),
          {
            id: 'raid-add-edit',
            icon: <Plus size={20} />,
            label: 'Aggiungi requisito',
            onClick: () => setAddDrawerOpen(true),
            variant: 'primary' as const,
          },
        ],
      };
    }

    return {
      primary: {
        label: t('raid.apply'),
        icon: <PackageCheck size={16} />,
        onClick: () => setModalType('apply'),
        disabled: !canApplyToStash,
        variant: 'primary' as const,
      },
      secondary: [
        {
          id: 'raid-add',
          icon: <Plus size={20} />,
          label: 'Aggiungi requisito',
          onClick: () => setAddDrawerOpen(true),
          variant: 'primary' as const,
        },
        ...(!isEmpty
          ? [
              {
                id: 'raid-edit-mode',
                icon: <Pencil size={18} />,
                label: t('common.edit'),
                onClick: () => setIsEditingRequirements(true),
                variant: 'default' as const,
              },
            ]
          : []),
      ],
    };
  }, [
    t,
    isEditingRequirements,
    canApplyToStash,
    isEmpty,
    selectedCount,
    selectedActionIds,
    selectedItemIds,
  ]);

  useSetFloatingNavDock(dockConfig);

  const { currentStashSnapshot, showStashDiffBanner } = useMemo(
    () => computeStashDiffPure(items, inventory, totalMaterials, raidPlan.ignoredStashSnapshot),
    [items, inventory, totalMaterials, raidPlan.ignoredStashSnapshot],
  );

  const handleAddAction = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newActionText.trim()) return;
    addRaidAction(newActionText);
    setNewActionText('');
  };

  const handlePickItem = (item: ItemInfo) => {
    setPickerOpen(false);

    // Se stiamo sostituendo un oggetto esistente (senza toccare quantità)
    if (replacingItemId) {
      replaceRaidItem(replacingItemId, item.id);
      setReplacingItemId(null);
      return;
    }

    // Cerca se l'oggetto è già presente nella pianificazione
    const existing = items.find(i => i.itemId === item.id);
    setQuantityModalItem({
      item,
      initialQty: existing ? existing.targetQuantity : 0,
      existingPlanItemId: existing?.id,
    });
  };

  const handleConfirmQuantity = (quantity: number) => {
    if (!quantityModalItem) return;
    if (quantity <= 0) {
      if (quantityModalItem.existingPlanItemId) {
        removeRaidItem(quantityModalItem.existingPlanItemId);
      }
    } else if (quantityModalItem.existingPlanItemId) {
      updateRaidItemTarget(quantityModalItem.existingPlanItemId, quantity);
    } else {
      addRaidItem(quantityModalItem.item.id, quantity);
    }
    setQuantityModalItem(null);
  };

  const handleConfirmModal = () => {
    if (modalType === 'apply') {
      const res = applyRaidPlanToStash();
      setNotification(t('raid.applySuccess').replace('{count}', String(res.addedItemsCount)));
      setTimeout(() => setNotification(null), 3500);
    } else if (modalType === 'reset') {
      resetRaidPlanProgress();
    } else if (modalType === 'clear') {
      clearRaidPlan();
    }
    setModalType(null);
  };

  return (
    <PageLayout
      headerSlot={
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Radar size={20} />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  {t('raid.title')}
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('raid.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle Vista Griglia / Lista */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setRaidPreferredViewMode('grid')}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    activeViewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                  title={t('stash.viewGrid')}
                  aria-label={t('stash.viewGrid')}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setRaidPreferredViewMode('list')}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    activeViewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                  title={t('stash.viewList')}
                  aria-label={t('stash.viewList')}
                >
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {/* Banner disallineamento Stash -> Raid */}
      {showStashDiffBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
          <span className="flex-1 font-medium">
            Alcuni requisiti dello stash sono cambiati, vuoi allineare la pianificazione?
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="primary"
              onClick={() => syncRaidWithStash()}
              className="h-7 px-2.5 text-[11px]"
            >
              Aggiorna
            </Button>
            <button
              type="button"
              onClick={() => ignoreStashDiff(currentStashSnapshot)}
              className="p-1 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-800/40 transition-colors cursor-pointer"
              title="Ignora"
              aria-label="Ignora"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
      {/* Notifica feedback */}
      {notification && (
        <div className="mb-4">
          <Callout variant="success">{notification}</Callout>
        </div>
      )}

      {isEmpty ? (
        <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
          <p className="max-w-xs text-sm font-medium text-gray-500 dark:text-gray-400">
            Qui non c&apos;è niente, aggiungi qualcosa con il &quot;+&quot;
          </p>
        </div>
      ) : isEditingRequirements ? (
        <div className="space-y-4 pb-20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Modifica requisiti
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Seleziona per eliminare in batch o regola le quantità richieste.
              </p>
            </div>
            {selectedCount > 0 && (
              <Button
                size="sm"
                variant="danger"
                onClick={handleBatchDelete}
                leftIcon={<Trash2 size={14} />}
              >
                Elimina ({selectedCount})
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {actions.map(act => {
              const checked = selectedActionIds.has(act.id);
              return (
                <div
                  key={act.id}
                  onClick={() => {
                    setSelectedActionIds(prev => {
                      const next = new Set(prev);
                      if (next.has(act.id)) next.delete(act.id);
                      else next.add(act.id);
                      return next;
                    });
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded accent-rose-600 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {act.text}
                    </div>
                    <div className="text-[11px] text-gray-400">{t('raid.spotActions')}</div>
                  </div>
                </div>
              );
            })}

            {items.map(raidItem => {
              const info = itemsInfo[raidItem.itemId];
              const displayName = info ? getItemName(info, language) : raidItem.itemId;
              const checked = selectedItemIds.has(raidItem.id);
              return (
                <div
                  key={raidItem.id}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-colors ${
                    checked
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedItemIds(prev => {
                        const next = new Set(prev);
                        if (next.has(raidItem.id)) next.delete(raidItem.id);
                        else next.add(raidItem.id);
                        return next;
                      });
                    }}
                    className="w-4 h-4 rounded accent-rose-600 cursor-pointer shrink-0 ml-1"
                  />
                  <ItemCardFrameV2
                    icon={info?.icon}
                    alt={displayName}
                    rarity={info?.rarity}
                    itemType={info?.item_type}
                    subcategory={info?.subcategory}
                    className="w-11 h-11 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {raidItem.fromStash ? 'Da Stash' : 'Manuale'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateRaidItemTarget(raidItem.id, Math.max(1, raidItem.targetQuantity - 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 active:scale-90 transition-all cursor-pointer"
                      aria-label="Diminuisci quantità richiesta"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold text-gray-900 dark:text-white">
                      {raidItem.targetQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateRaidItemTarget(raidItem.id, raidItem.targetQuantity + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 active:scale-90 transition-all cursor-pointer"
                      aria-label="Aumenta quantità richiesta"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      <div className="space-y-6 pb-20">
        {/* ── SEZIONE 1: AZIONI SPOT ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('raid.spotActions')}
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {actions.filter(a => a.completed).length}/{actions.length}
            </span>
          </div>

          {/* Lista azioni */}
          {actions.length === 0 ? (
            !isRaidRunning ? (
              <div className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                {t('raid.noActions')}
              </div>
            ) : null
          ) : (
            <div className="space-y-2">
              {actions.map(action => (
                <div
                  key={action.id}
                  className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-2xl border transition-all ${
                    action.completed
                      ? 'bg-gray-50/80 dark:bg-gray-900/40 border-gray-200/60 dark:border-gray-800/60 opacity-60'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xs'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <ActionCheckbox
                      label={action.text}
                      checked={action.completed}
                      onToggle={() => toggleRaidAction(action.id)}
                    />
                  </div>

                  {/* Pulsante rimozione (nascosto in Focus Mode) */}
                  {!isRaidRunning && (
                    <button
                      onClick={() => removeRaidAction(action.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 active:scale-95 transition-colors cursor-pointer shrink-0"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── SEZIONE 2: OGGETTI DA RECUPERARE ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('raid.itemsToFind')}
            </h2>
          </div>

          {items.length === 0 ? (
            !isRaidRunning ? (
              <EmptyState title={t('raid.noItems')} compact />
            ) : null
          ) : activeViewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {items.map(raidItem => {
                const info = itemsInfo[raidItem.itemId];
                const stashOwned = raidItem.fromStash ? (inventory[raidItem.itemId] ?? 0) : undefined;
                const stashRequired = raidItem.fromStash ? (totalMaterials[raidItem.itemId] ?? 0) : undefined;

                return (
                  <RaidItemCard
                    key={raidItem.id}
                    raidItem={raidItem}
                    itemInfo={info}
                    stashOwned={stashOwned}
                    stashRequired={stashRequired}
                    hideDelete={isRaidRunning}
                    onIncrementFound={() => updateRaidItemFound(raidItem.id, 1)}
                    onDecrementFound={() => updateRaidItemFound(raidItem.id, -1)}
                    onSetFound={(val) => setRaidItemFoundQuantity(raidItem.id, val)}
                    onComplete={() => setRaidItemFoundAll(raidItem.id)}
                    onResetProgress={() => setRaidItemFoundQuantity(raidItem.id, 0)}
                    onOpenEditModal={() => {
                      if (info) {
                        setQuantityModalItem({
                          item: info,
                          initialQty: raidItem.targetQuantity,
                          existingPlanItemId: raidItem.id,
                        });
                      }
                    }}
                    onRemove={() => removeRaidItem(raidItem.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map(raidItem => {
                const info = itemsInfo[raidItem.itemId];
                const itemName = info ? getItemName(info, language) : raidItem.itemId;
                const isComplete = raidItem.foundQuantity >= raidItem.targetQuantity;
                const stashOwned = raidItem.fromStash ? (inventory[raidItem.itemId] ?? 0) : 0;
                const stashRequired = raidItem.fromStash ? (totalMaterials[raidItem.itemId] ?? 0) : 0;
                const isStashCoveredWithRaid = stashRequired > 0 && stashOwned < stashRequired && (stashOwned + raidItem.foundQuantity >= stashRequired);

                return (
                  <div
                    key={raidItem.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isComplete
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icona Oggetto */}
                      <div className="w-11 h-11 shrink-0">
                        <ItemCardFrameV2
                          icon={info?.icon}
                          rarity={info?.rarity}
                          itemType={info?.item_type}
                          subcategory={info?.subcategory}
                          compact
                          thumb
                        />
                      </div>

                      {/* Info Oggetto (click disabilitato: solo visualizzazione) */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                          {itemName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                              isComplete
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {raidItem.foundQuantity} / {raidItem.targetQuantity}
                          </span>
                          {stashRequired > 0 && (
                            <span className="text-[10px] font-mono text-gray-400">
                              • {t('raid.stashProgress', { owned: stashOwned, required: stashRequired })}
                            </span>
                          )}
                          {isComplete && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check size={12} className="stroke-[3]" /> {t('raid.foundAll')}
                            </span>
                          )}
                          {isStashCoveredWithRaid && (
                            <span className="text-[9px] font-sans font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {t('raid.stashCoveredWithRaid')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Azioni Touch Rapide */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Micro Stepper - / + */}
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 border border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => updateRaidItemFound(raidItem.id, -1)}
                            disabled={raidItem.foundQuantity <= 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                            aria-label={t('raid.decreaseFound')}
                          >
                            <Minus size={13} />
                          </button>
                          <button
                            onClick={() => updateRaidItemFound(raidItem.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 active:scale-95 transition-all cursor-pointer"
                            aria-label={t('raid.increaseFound')}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Pulsante Touch "Completato" */}
                        <button
                          onClick={() => {
                            if (isComplete) {
                              setRaidItemFoundQuantity(raidItem.id, 0);
                            } else {
                              setRaidItemFoundAll(raidItem.id);
                            }
                          }}
                          className={`h-8 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                            isComplete
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          }`}
                          title={t('raid.foundAll')}
                          aria-label={t('raid.foundAll')}
                        >
                          <Check size={14} className="stroke-[2.5]" />
                          <span className="hidden sm:inline">{t('raid.foundAll')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      )}

      {/* ── DRAWER FROM BOTTOM: AGGIUNGI REQUISITO (AZIONE O OGGETTO) ── */}
      {addDrawerOpen && (
        <Drawer
          onClose={() => {
            setAddDrawerOpen(false);
            setDrawerShowPicker(false);
          }}
          from="bottom"
          title={drawerShowPicker ? t('raid.addItem') : 'Aggiungi requisito'}
        >
          {drawerShowPicker ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setDrawerShowPicker(false)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                ← {t('common.back')}
              </button>
              <ItemPicker
                context="raid"
                embedded
                onPick={(item) => {
                  setAddDrawerOpen(false);
                  setDrawerShowPicker(false);
                  handlePickItem(item);
                }}
                onClose={() => setDrawerShowPicker(false)}
              />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Blocco 1: Azioni Spot */}
              <div className="space-y-2.5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('raid.spotActions')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('raid.spotActionsDesc')}
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    handleAddAction(e);
                    setAddDrawerOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newActionText}
                    onChange={e => setNewActionText(e.target.value)}
                    placeholder={t('raid.actionPlaceholder')}
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={!newActionText.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus size={16} />
                    <span>{t('raid.addAction')}</span>
                  </button>
                </form>
              </div>

              {/* Blocco 2: Oggetti da recuperare */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('raid.itemsToFind')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('raid.itemsToFindDesc')}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus size={14} />}
                  onClick={() => setDrawerShowPicker(true)}
                  className="shrink-0"
                >
                  {t('raid.addItem')}
                </Button>
              </div>
            </div>
          )}
        </Drawer>
      )}

      {/* ── MODALE SELETTORE OGGETTI ── */}
      {pickerOpen && (
        <ItemPicker
          context="raid"
          onPick={handlePickItem}
          onClose={() => {
            setPickerOpen(false);
            setReplacingItemId(null);
          }}
        />
      )}

      {/* ── MODALE QUANTITÀ OGGETTO (STANDARD APP) ── */}
      {quantityModalItem && (
        <ItemQuantityModal
          item={quantityModalItem.item}
          initialQuantity={quantityModalItem.initialQty}
          onConfirm={handleConfirmQuantity}
          onClose={() => setQuantityModalItem(null)}
          onChangeItem={() => {
            const planId = quantityModalItem.existingPlanItemId;
            setQuantityModalItem(null);
            if (planId) {
              setReplacingItemId(planId);
            }
            setPickerOpen(true);
          }}
          title={quantityModalItem.existingPlanItemId ? t('common.edit') : t('common.add')}
          confirmLabel={t('common.save')}
        />
      )}

      {/* ── DIALOG DI CONFERMA (APPLICA / AZZERA / ELIMINA) ── */}
      {modalType && (
        <ConfirmActionModal
          title={
            modalType === 'apply'
              ? t('raid.applyTitle')
              : modalType === 'reset'
              ? t('raid.resetTitle')
              : t('raid.clearTitle')
          }
          message={
            modalType === 'apply'
              ? t('raid.applyMessage')
              : modalType === 'reset'
              ? t('raid.resetMessage')
              : t('raid.clearMessage')
          }
          variant={modalType === 'clear' ? 'danger' : modalType === 'reset' ? 'warning' : 'primary'}
          confirmText={
            modalType === 'apply'
              ? t('raid.apply')
              : modalType === 'reset'
              ? t('raid.reset')
              : t('common.delete')
          }
          onConfirm={handleConfirmModal}
          onClose={() => setModalType(null)}
        />
      )}
    </PageLayout>
  );
};
