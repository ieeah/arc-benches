import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import { bootProfileState } from './boot';
import {
  defaultActiveModules, defaultHideoutLevels, defaultTargetLevels, levelsAbove,
} from './gameData';

export type ProgressSlice = Pick<AppState,
  'hideoutLevels' | 'targetLevels' | 'activeModules' | 'checkedActions' | 'filterHideCompleted' | 'listOrder' |
  'setModuleCurrentLevel' | 'toggleTargetLevel' | 'toggleModuleActive' | 'setFilterHideCompleted' |
  'setListOrder' | 'toggleAction' | 'upgradeModule' | 'resetProgress'
>;

export const createProgressSlice: StateCreator<AppState, [], [], ProgressSlice> = (set, get) => ({
  hideoutLevels: bootProfileState.hideoutLevels,
  targetLevels: bootProfileState.targetLevels,
  activeModules: bootProfileState.activeModules,
  checkedActions: bootProfileState.checkedActions,
  filterHideCompleted: bootProfileState.filterHideCompleted,
  listOrder: bootProfileState.listOrder,

  setModuleCurrentLevel: (moduleId, level, deductMaterials = false) => {
    const s = get();
    const list = s.getAllLists().find(w => w.id === moduleId);
    const prevLevel = s.hideoutLevels[moduleId] ?? 0;
    const hideoutLevels = { ...s.hideoutLevels, [moduleId]: level };

    const inventory = { ...s.inventory };
    const checkedActions = { ...s.checkedActions };
    const targetLevels = { ...s.targetLevels };
    if (list && level > prevLevel) {
      list.levels
        .filter(l => l.level > prevLevel && l.level <= level)
        .forEach(l => {
          if (deductMaterials) l.requirementItemIds.forEach(req => {
            inventory[req.itemId] = Math.max(0, (inventory[req.itemId] ?? 0) - req.quantity);
          });
          (l.actions ?? []).forEach(a => { checkedActions[`${moduleId}|${l.level}|${a.id}`] = true; });
        });
      const next = level + 1;
      const cur = targetLevels[moduleId] ?? [];
      if (next <= list.maxLevel && !cur.includes(next)) targetLevels[moduleId] = [...cur, next].sort((a, b) => a - b);
    }

    set({ hideoutLevels, inventory, checkedActions, targetLevels });
  },

  toggleTargetLevel: (moduleId, level) => {
    const s = get();
    const cur = s.targetLevels[moduleId] ?? [];
    const next = cur.includes(level)
      ? cur.filter(l => l !== level)
      : [...cur, level].sort((a, b) => a - b);
    set({ targetLevels: { ...s.targetLevels, [moduleId]: next } });
  },

  toggleModuleActive: (moduleId) => {
    const s = get();
    set({ activeModules: { ...s.activeModules, [moduleId]: !s.activeModules[moduleId] } });
  },

  setFilterHideCompleted: (val) => {
    set({ filterHideCompleted: val });
  },

  setListOrder: (order) => {
    set({ listOrder: order });
  },

  toggleAction: (listId, level, actionId) => {
    const s = get();
    const key = `${listId}|${level}|${actionId}`;
    set({ checkedActions: { ...s.checkedActions, [key]: !s.checkedActions[key] } });
  },

  upgradeModule: (moduleId) => {
    const s = get();
    const list = s.getAllLists().find(w => w.id === moduleId);
    if (!list) return;
    const currentLevel = s.hideoutLevels[moduleId] ?? 0;
    if (currentLevel >= list.maxLevel) return;
    const nextLevel = list.levels.find(l => l.level === currentLevel + 1);
    if (!nextLevel) return;
    const inventory = { ...s.inventory };
    nextLevel.requirementItemIds.forEach(req => {
      inventory[req.itemId] = Math.max(0, (inventory[req.itemId] ?? 0) - req.quantity);
    });
    const newLevel = currentLevel + 1;
    const hideoutLevels = { ...s.hideoutLevels, [moduleId]: newLevel };
    const checkedActions = { ...s.checkedActions };
    (nextLevel.actions ?? []).forEach(a => { checkedActions[`${moduleId}|${newLevel}|${a.id}`] = true; });
    const targetLevels = { ...s.targetLevels };
    const next = newLevel + 1;
    const cur = targetLevels[moduleId] ?? [];
    if (next <= list.maxLevel && !cur.includes(next)) targetLevels[moduleId] = [...cur, next].sort((a, b) => a - b);
    set({ inventory, hideoutLevels, checkedActions, targetLevels });
  },

  resetProgress: () => {
    const s = get();
    const hideoutLevels = { ...defaultHideoutLevels };
    const targetLevels = { ...defaultTargetLevels };
    const activeModules = { ...defaultActiveModules };
    [...s.sharedCustomLists, ...s.customLists].forEach(l => {
      hideoutLevels[l.id] = 0;
      targetLevels[l.id] = levelsAbove(0, l.maxLevel);
      activeModules[l.id] = true;
    });
    set({
      hideoutLevels,
      targetLevels,
      activeModules,
      inventory: {},
      filterHideCompleted: true,
      listOrder: s.listOrder,
      customLists: s.customLists,
      checkedActions: {},
    });
  },
});
