import type { StateCreator } from 'zustand';
import type { AppState, List, ListExportFile } from '@/types';
import { bootProfileState, bootSharedLists } from '@/store/boot';
import { computeEffectiveItemsInfo, itemsInfo, levelsAbove, projects, REFINER_ID, workbenches } from '@/store/gameData';
import { generateUUID } from '@/lib/uuid';
import {
  getAllListsPure,
  getOrderedListsPure,
  getRefinerLevelPure,
  getActiveListsPure,
  getMaxedListsPure,
  getTotalRequiredMaterialsPure,
  getMissingMaterialsPure,
  getMissingActionsPure,
  getAvailableUpgradesPure,
  getActiveExpeditionPure,
  getExpeditionCompletedPhasePure,
} from '@/store/selectors';

export type ListsSlice = Pick<AppState,
  'workbenches' | 'projects' | 'itemsInfo' | 'customLists' | 'sharedCustomLists' |
  'createCustomList' | 'updateCustomList' | 'deleteCustomList' | 'importLists' |
  'getAllLists' | 'getOrderedLists' | 'getRefinerLevel' | 'getActiveLists' | 'getMaxedLists' |
  'getTotalRequiredMaterials' | 'getMissingMaterials' | 'getMissingActions' | 'getAvailableUpgrades' |
  'syncItemsOverrides'
>;


export const createListsSlice: StateCreator<AppState, [], [], ListsSlice> = (set, get) => ({
  workbenches,
  projects,
  itemsInfo,
  syncItemsOverrides: () => {
    set({ itemsInfo: computeEffectiveItemsInfo() });
  },
  customLists: bootProfileState.customLists,
  sharedCustomLists: bootSharedLists,

  // ---- Custom lists -------------------------------------------------------

  createCustomList: ({ name, levels, shared = false, expirationDate }) => {
    const s = get();
    const id = `custom:${generateUUID()}`;
    const maxLevel = levels.length ? Math.max(...levels.map(l => l.level)) : 1;
    const list: List = { id, name, maxLevel, levels, custom: true, listType: 'custom', shared, expirationDate };

    const currentLevels = { ...s.currentLevels, [id]: 0 };
    const targetLevels = { ...s.targetLevels, [id]: levelsAbove(0, maxLevel) };
    const activeModules = { ...s.activeModules, [id]: true };
    const listOrder = [...s.listOrder, id];

    if (shared) {
      set({ sharedCustomLists: [...s.sharedCustomLists, list], currentLevels, targetLevels, activeModules, listOrder });
    } else {
      set({ customLists: [...s.customLists, list], currentLevels, targetLevels, activeModules, listOrder });
    }
    return id;
  },

  updateCustomList: (id, patch) => {
    const s = get();
    const sharedIdx = s.sharedCustomLists.findIndex(l => l.id === id);
    const localIdx = s.customLists.findIndex(l => l.id === id);
    const isShared = sharedIdx >= 0;
    const idx = isShared ? sharedIdx : localIdx;
    if (idx === -1) return;

    const prev = isShared ? s.sharedCustomLists[idx] : s.customLists[idx];
    const levels = patch.levels ?? prev.levels;
    const maxLevel = levels.length ? Math.max(...levels.map(l => l.level)) : 1;
    const expirationDate = 'expirationDate' in patch ? patch.expirationDate : prev.expirationDate;
    const updated: List = {
      ...prev,
      name: patch.name ?? prev.name,
      expirationDate,
      levels,
      maxLevel,
    };


    const currentLevels = { ...s.currentLevels, [id]: Math.min(s.currentLevels[id] ?? 0, maxLevel) };
    const prevTargets = s.targetLevels[id] ?? levelsAbove(0, maxLevel);
    const targetLevels = { ...s.targetLevels, [id]: prevTargets.filter(l => l <= maxLevel) };

    if (isShared) {
      const sharedCustomLists = [...s.sharedCustomLists];
      sharedCustomLists[idx] = updated;
      set({ sharedCustomLists, currentLevels, targetLevels });
    } else {
      const customLists = [...s.customLists];
      customLists[idx] = updated;
      set({ customLists, currentLevels, targetLevels });
    }
  },

  deleteCustomList: (id) => {
    const s = get();
    const isShared = s.sharedCustomLists.some(l => l.id === id);
    const currentLevels = { ...s.currentLevels }; delete currentLevels[id];
    const targetLevels = { ...s.targetLevels }; delete targetLevels[id];
    const activeModules = { ...s.activeModules }; delete activeModules[id];
    const listOrder = s.listOrder.filter(x => x !== id);

    if (isShared) {
      set({ sharedCustomLists: s.sharedCustomLists.filter(l => l.id !== id), currentLevels, targetLevels, activeModules, listOrder });
    } else {
      set({ customLists: s.customLists.filter(l => l.id !== id), currentLevels, targetLevels, activeModules, listOrder });
    }
  },

  importLists: (data: ListExportFile) => {
    const s = get();
    const customLists = [...s.customLists];
    const sharedCustomLists = [...s.sharedCustomLists];
    const currentLevels = { ...s.currentLevels };
    const targetLevels = { ...s.targetLevels };
    const activeModules = { ...s.activeModules };
    const listOrder = [...s.listOrder];

    for (const entry of data.lists) {
      const { list, currentLevel, targetLevels: entryTargets, active } = entry;
      const isGameList = s.workbenches.some(w => w.id === list.id) || s.projects.some(p => p.id === list.id);
      if (!isGameList) {
        if (list.shared) {
          const idx = sharedCustomLists.findIndex(l => l.id === list.id);
          if (idx >= 0) sharedCustomLists[idx] = list;
          else { sharedCustomLists.push(list); listOrder.push(list.id); }
        } else {
          const idx = customLists.findIndex(l => l.id === list.id);
          if (idx >= 0) customLists[idx] = list;
          else { customLists.push(list); listOrder.push(list.id); }
        }
      }
      currentLevels[list.id] = currentLevel;
      targetLevels[list.id] = entryTargets;
      activeModules[list.id] = active;
    }

    const inventory = data.inventory ?? s.inventory;
    set({ customLists, sharedCustomLists, currentLevels, targetLevels, activeModules, listOrder, inventory });
  },

  // ---- Selectors (thin wrappers over pure functions in selectors.ts) ------

  getAllLists: () => {
    const s = get();
    const activeExpedition = getActiveExpeditionPure(s.expeditions, s.completedExpeditionsCount);
    return getAllListsPure(s.workbenches, s.projects, s.sharedCustomLists, s.customLists, activeExpedition);
  },

  getOrderedLists: () => {
    const s = get();
    const activeExpedition = getActiveExpeditionPure(s.expeditions, s.completedExpeditionsCount);
    return getOrderedListsPure(
      getAllListsPure(s.workbenches, s.projects, s.sharedCustomLists, s.customLists, activeExpedition),
      s.listOrder,
    );
  },

  getRefinerLevel: () => getRefinerLevelPure(get().currentLevels, REFINER_ID),

  getActiveLists: () => {
    const s = get();
    const activeExpedition = getActiveExpeditionPure(s.expeditions, s.completedExpeditionsCount);
    const expeditionPhase = getExpeditionCompletedPhasePure(activeExpedition, s.inventory, s.checkedActions);
    const effectiveCurrentLevels = activeExpedition
      ? { ...s.currentLevels, [activeExpedition.id]: expeditionPhase }
      : s.currentLevels;

    return getActiveListsPure(
      getOrderedListsPure(getAllListsPure(s.workbenches, s.projects, s.sharedCustomLists, s.customLists, activeExpedition), s.listOrder),
      effectiveCurrentLevels,
    );
  },

  getMaxedLists: () => {
    const s = get();
    const activeExpedition = getActiveExpeditionPure(s.expeditions, s.completedExpeditionsCount);
    const expeditionPhase = getExpeditionCompletedPhasePure(activeExpedition, s.inventory, s.checkedActions);
    const effectiveCurrentLevels = activeExpedition
      ? { ...s.currentLevels, [activeExpedition.id]: expeditionPhase }
      : s.currentLevels;

    return getMaxedListsPure(
      getOrderedListsPure(getAllListsPure(s.workbenches, s.projects, s.sharedCustomLists, s.customLists, activeExpedition), s.listOrder),
      effectiveCurrentLevels,
    );
  },

  getTotalRequiredMaterials: (excludeModuleId) => {
    const s = get();
    const activeExpedition = getActiveExpeditionPure(s.expeditions, s.completedExpeditionsCount);
    const expeditionPhase = getExpeditionCompletedPhasePure(activeExpedition, s.inventory, s.checkedActions);
    const effectiveCurrentLevels = activeExpedition
      ? { ...s.currentLevels, [activeExpedition.id]: expeditionPhase }
      : s.currentLevels;

    return getTotalRequiredMaterialsPure(
      getAllListsPure(s.workbenches, s.projects, s.sharedCustomLists, s.customLists, activeExpedition),
      s.activeModules,
      effectiveCurrentLevels,
      s.targetLevels,
      excludeModuleId,
      Date.now(),
      s.checkedActions,
    );
  },

  getMissingMaterials: () => {
    const s = get();
    const activeExpedition = getActiveExpeditionPure(s.expeditions, s.completedExpeditionsCount);
    const expeditionPhase = getExpeditionCompletedPhasePure(activeExpedition, s.inventory, s.checkedActions);
    const effectiveCurrentLevels = activeExpedition
      ? { ...s.currentLevels, [activeExpedition.id]: expeditionPhase }
      : s.currentLevels;

    const total = getTotalRequiredMaterialsPure(
      getAllListsPure(s.workbenches, s.projects, s.sharedCustomLists, s.customLists, activeExpedition),
      s.activeModules,
      effectiveCurrentLevels,
      s.targetLevels,
      undefined,
      Date.now(),
      s.checkedActions,
    );
    return getMissingMaterialsPure(total, s.inventory);
  },

  getMissingActions: () => {
    const s = get();
    const activeExpedition = getActiveExpeditionPure(s.expeditions, s.completedExpeditionsCount);
    const expeditionPhase = getExpeditionCompletedPhasePure(activeExpedition, s.inventory, s.checkedActions);
    const effectiveCurrentLevels = activeExpedition
      ? { ...s.currentLevels, [activeExpedition.id]: expeditionPhase }
      : s.currentLevels;

    return getMissingActionsPure(
      getAllListsPure(s.workbenches, s.projects, s.sharedCustomLists, s.customLists, activeExpedition),
      s.activeModules,
      effectiveCurrentLevels,
      s.targetLevels,
      s.checkedActions,
    );
  },

  getAvailableUpgrades: () => {
    const s = get();
    const activeExpedition = getActiveExpeditionPure(s.expeditions, s.completedExpeditionsCount);
    const expeditionPhase = getExpeditionCompletedPhasePure(activeExpedition, s.inventory, s.checkedActions);
    const effectiveCurrentLevels = activeExpedition
      ? { ...s.currentLevels, [activeExpedition.id]: expeditionPhase }
      : s.currentLevels;

    return getAvailableUpgradesPure(
      getAllListsPure(s.workbenches, s.projects, s.sharedCustomLists, s.customLists, activeExpedition),
      s.activeModules,
      effectiveCurrentLevels,
      s.inventory,
    );
  },
});
