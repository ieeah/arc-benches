import type { StateCreator } from 'zustand';
import type { AppState, List, ListExportFile } from '../types';
import { bootProfileState, bootSharedLists } from './boot';
import { itemsInfo, levelsAbove, REFINER_ID, workbenches } from './gameData';
import {
  getAllListsPure,
  getOrderedListsPure,
  getRefinerLevelPure,
  getActiveListsPure,
  getMaxedListsPure,
  getTotalRequiredMaterialsPure,
  getMissingMaterialsPure,
  getAvailableUpgradesPure,
} from './selectors';

export type ListsSlice = Pick<AppState,
  'workbenches' | 'itemsInfo' | 'customLists' | 'sharedCustomLists' |
  'createCustomList' | 'updateCustomList' | 'deleteCustomList' | 'importLists' |
  'getAllLists' | 'getOrderedLists' | 'getRefinerLevel' | 'getActiveLists' | 'getMaxedLists' |
  'getTotalRequiredMaterials' | 'getMissingMaterials' | 'getAvailableUpgrades'
>;

export const createListsSlice: StateCreator<AppState, [], [], ListsSlice> = (set, get) => ({
  workbenches,
  itemsInfo,
  customLists: bootProfileState.customLists,
  sharedCustomLists: bootSharedLists,

  // ---- Custom lists -------------------------------------------------------

  createCustomList: ({ name, levels, listType, shared = false }) => {
    const s = get();
    const id = `custom:${crypto.randomUUID()}`;
    const maxLevel = levels.length ? Math.max(...levels.map(l => l.level)) : 1;
    const list: List = { id, name, maxLevel, levels, custom: true, listType: listType ?? 'custom', shared };

    const hideoutLevels = { ...s.hideoutLevels, [id]: 0 };
    const targetLevels = { ...s.targetLevels, [id]: levelsAbove(0, maxLevel) };
    const activeModules = { ...s.activeModules, [id]: true };
    const listOrder = [...s.listOrder, id];

    if (shared) {
      set({ sharedCustomLists: [...s.sharedCustomLists, list], hideoutLevels, targetLevels, activeModules, listOrder });
    } else {
      set({ customLists: [...s.customLists, list], hideoutLevels, targetLevels, activeModules, listOrder });
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
    const updated = { ...prev, name: patch.name ?? prev.name, listType: patch.listType ?? prev.listType, levels, maxLevel };

    const hideoutLevels = { ...s.hideoutLevels, [id]: Math.min(s.hideoutLevels[id] ?? 0, maxLevel) };
    const prevTargets = s.targetLevels[id] ?? levelsAbove(0, maxLevel);
    const targetLevels = { ...s.targetLevels, [id]: prevTargets.filter(l => l <= maxLevel) };

    if (isShared) {
      const sharedCustomLists = [...s.sharedCustomLists];
      sharedCustomLists[idx] = updated;
      set({ sharedCustomLists, hideoutLevels, targetLevels });
    } else {
      const customLists = [...s.customLists];
      customLists[idx] = updated;
      set({ customLists, hideoutLevels, targetLevels });
    }
  },

  deleteCustomList: (id) => {
    const s = get();
    const isShared = s.sharedCustomLists.some(l => l.id === id);
    const hideoutLevels = { ...s.hideoutLevels }; delete hideoutLevels[id];
    const targetLevels = { ...s.targetLevels }; delete targetLevels[id];
    const activeModules = { ...s.activeModules }; delete activeModules[id];
    const listOrder = s.listOrder.filter(x => x !== id);

    if (isShared) {
      set({ sharedCustomLists: s.sharedCustomLists.filter(l => l.id !== id), hideoutLevels, targetLevels, activeModules, listOrder });
    } else {
      set({ customLists: s.customLists.filter(l => l.id !== id), hideoutLevels, targetLevels, activeModules, listOrder });
    }
  },

  importLists: (data: ListExportFile) => {
    const s = get();
    const customLists = [...s.customLists];
    const sharedCustomLists = [...s.sharedCustomLists];
    const hideoutLevels = { ...s.hideoutLevels };
    const targetLevels = { ...s.targetLevels };
    const activeModules = { ...s.activeModules };
    const listOrder = [...s.listOrder];

    for (const entry of data.lists) {
      const { list, currentLevel, targetLevels: entryTargets, active } = entry;
      const isGameList = s.workbenches.some(w => w.id === list.id);
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
      hideoutLevels[list.id] = currentLevel;
      targetLevels[list.id] = entryTargets;
      activeModules[list.id] = active;
    }

    const inventory = data.inventory ?? s.inventory;
    set({ customLists, sharedCustomLists, hideoutLevels, targetLevels, activeModules, listOrder, inventory });
  },

  // ---- Selectors (thin wrappers over pure functions in selectors.ts) ------

  getAllLists: () => {
    const s = get();
    return getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists);
  },

  getOrderedLists: () => {
    const s = get();
    return getOrderedListsPure(
      getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists),
      s.listOrder,
    );
  },

  getRefinerLevel: () => getRefinerLevelPure(get().hideoutLevels, REFINER_ID),

  getActiveLists: () => {
    const s = get();
    return getActiveListsPure(
      getOrderedListsPure(getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists), s.listOrder),
      s.hideoutLevels,
    );
  },

  getMaxedLists: () => {
    const s = get();
    return getMaxedListsPure(
      getOrderedListsPure(getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists), s.listOrder),
      s.hideoutLevels,
    );
  },

  getTotalRequiredMaterials: (excludeModuleId) => {
    const s = get();
    return getTotalRequiredMaterialsPure(
      getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists),
      s.activeModules,
      s.hideoutLevels,
      s.targetLevels,
      excludeModuleId,
    );
  },

  getMissingMaterials: () => {
    const s = get();
    const total = getTotalRequiredMaterialsPure(
      getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists),
      s.activeModules,
      s.hideoutLevels,
      s.targetLevels,
    );
    return getMissingMaterialsPure(total, s.inventory);
  },

  getAvailableUpgrades: () => {
    const s = get();
    return getAvailableUpgradesPure(
      getAllListsPure(s.workbenches, s.sharedCustomLists, s.customLists),
      s.activeModules,
      s.hideoutLevels,
      s.inventory,
    );
  },
});
