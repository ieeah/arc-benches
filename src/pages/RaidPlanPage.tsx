import { useState, useEffect, useMemo } from 'react';
import {
  Radar, Plus, Check, Trash2, RotateCcw, PackageCheck, Minus, LayoutGrid, List as ListIcon, Pencil, Play, Square
} from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '@/store';
import { useTranslation, getItemName } from '@/i18n';
import { StickyHeader } from '@/components/StickyHeader';
import { ItemPicker } from '@/components/ItemPicker';
import { ItemQuantityModal } from '@/components/ItemQuantityModal';
import { ActionCheckbox } from '@/components/ActionCheckbox';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { RaidItemCard } from '@/components/RaidItemCard';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { Button, Callout, EmptyState } from '@/components/ui';
import { getAllListsPure, getTotalRequiredMaterialsPure, getActiveExpeditionPure } from '@/store/selectors';
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
  const setIsRaidRunning = useAppStore(s => s.setIsRaidRunning);
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

  const isRaidRunning = raidPlan.isRaidRunning;
  const actions = raidPlan.actions;
  const items = raidPlan.items;
  const preferredViewMode = raidPlan.preferredViewMode ?? 'grid';

  // In modalità configurazione (inattivo) forza la vista 'list'. In focus mode (attivo) usa la preferenza dell'utente salvata nel profilo.
  const activeViewMode = isRaidRunning ? preferredViewMode : 'list';

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
    <div className="pb-32 min-h-dvh">
      {/* ── HEADER STICKY ── */}
      <StickyHeader elevated className="space-y-2 px-4 py-3">
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
            {/* Toggle Stato Incursione: Player style Play / Stop */}
            <button
              onClick={() => setIsRaidRunning(!isRaidRunning)}
              disabled={actions.length === 0 && items.length === 0}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer border shrink-0 disabled:opacity-40 disabled:pointer-events-none ${
                isRaidRunning
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/25 hover:bg-emerald-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={isRaidRunning ? t('raid.statusActive') : t('raid.statusInactive')}
              aria-label={isRaidRunning ? t('raid.statusActive') : t('raid.statusInactive')}
            >
              {isRaidRunning ? (
                <Square size={16} className="fill-current" />
              ) : (
                <Play size={17} className="fill-current translate-x-0.5" />
              )}
            </button>

            {/* Toggle Vista Griglia / Lista (Visibile e selezionabile solo in Incursione Attiva) */}
            {isRaidRunning && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in duration-200">
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
            )}
          </div>
        </div>

        {/* ── 3 PULSANTI AZIONE COMPATTI E DISCRETI (Nascosti in Focus Mode) ── */}
        {!isRaidRunning && (
          <div className="flex items-center justify-between gap-2 pt-1 animate-in fade-in duration-150">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalType('apply')}
              disabled={actions.length === 0 && items.length === 0}
              leftIcon={<PackageCheck size={14} />}
              className="flex-1"
            >
              {t('raid.apply')}
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setModalType('reset')}
              disabled={actions.length === 0 && items.length === 0}
              leftIcon={<RotateCcw size={13} />}
              title={t('raid.reset')}
              aria-label={t('raid.reset')}
            >
              <span className="hidden sm:inline text-[11px]">{t('raid.reset')}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalType('clear')}
              disabled={actions.length === 0 && items.length === 0}
              leftIcon={<Trash2 size={13} />}
              title={t('raid.clear')}
              aria-label={t('raid.clear')}
              className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <span className="hidden sm:inline text-[11px]">{t('raid.clear')}</span>
            </Button>
          </div>
        )}
      </StickyHeader>

      {/* Notifica feedback */}
      {notification && (
        <div className="mx-4 mt-3">
          <Callout variant="success">{notification}</Callout>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* ── SEZIONE 1: AZIONI SPOT ── */}
        <section className="space-y-3">
          {/* Header e Form Aggiunta: Nascosti in Focus Mode */}
          {!isRaidRunning && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('raid.spotActions')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('raid.spotActionsDesc')}
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {actions.filter(a => a.completed).length}/{actions.length}
                </span>
              </div>

              {/* Form rapido inserimento azione */}
              <form onSubmit={handleAddAction} className="flex gap-2">
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
            </>
          )}

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
          {/* Header e Aggiungi Oggetto: Nascosti in Focus Mode */}
          {!isRaidRunning && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('raid.itemsToFind')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('raid.itemsToFindDesc')}
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setPickerOpen(true)}
                leftIcon={<Plus size={14} />}
              >
                {t('raid.addItem')}
              </Button>
            </div>
          )}

          {items.length === 0 ? (
            !isRaidRunning ? (
              <EmptyState title={t('raid.noItems')} compact />
            ) : null
          ) : activeViewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {items.map(raidItem => {
                const info = itemsInfo[raidItem.itemId];
                const stashOwned = inventory[raidItem.itemId] ?? 0;
                const stashRequired = totalMaterials[raidItem.itemId] ?? 0;

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
                const stashOwned = inventory[raidItem.itemId] ?? 0;
                const stashRequired = totalMaterials[raidItem.itemId] ?? 0;
                const isStashCovered = stashRequired > 0 && stashOwned >= stashRequired;
                const isStashCoveredWithRaid = stashRequired > 0 && !isStashCovered && (stashOwned + raidItem.foundQuantity >= stashRequired);

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
                          {isStashCovered ? (
                            <span className="text-[9px] font-sans font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {t('raid.stashCoveredShort')}
                            </span>
                          ) : isStashCoveredWithRaid ? (
                            <span className="text-[9px] font-sans font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {t('raid.stashCoveredWithRaid')}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Azioni Touch Rapide */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Pulsante Modifica Elemento (apre la modale per cambiare sia quantità che oggetto) */}
                        {!isRaidRunning && (
                          <button
                            type="button"
                            onClick={() => {
                              if (info) {
                                setQuantityModalItem({
                                  item: info,
                                  initialQty: raidItem.targetQuantity,
                                  existingPlanItemId: raidItem.id,
                                });
                              }
                            }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-500 bg-gray-50 dark:bg-gray-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-200 dark:border-gray-700 active:scale-95 transition-all cursor-pointer"
                            title={t('common.edit')}
                            aria-label={t('common.edit')}
                          >
                            <Pencil size={13} />
                          </button>
                        )}
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

                        {/* Rimuovi (nascosto in Focus Mode) */}
                        {!isRaidRunning && (
                          <button
                            onClick={() => removeRaidItem(raidItem.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 active:scale-95 transition-colors cursor-pointer"
                            aria-label={t('common.delete')}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>



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
    </div>
  );
};
