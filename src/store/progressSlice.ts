import type { StateCreator } from 'zustand';
import type { AppState } from '@/types';
import { bootProfileState } from '@/store/boot';
import {
  defaultActiveModules, defaultHideoutLevels, defaultTargetLevels, levelsAbove,
} from '@/store/gameData';

export type ProgressSlice = Pick<AppState,
  'hideoutLevels' | 'targetLevels' | 'activeModules' | 'checkedActions' | 'filterHideCompleted' | 'listOrder' |
  'ownedBlueprints' | 'filterHideOwnedBlueprints' |
  'setModuleCurrentLevel' | 'toggleTargetLevel' | 'toggleModuleActive' | 'setFilterHideCompleted' |
  'setListOrder' | 'toggleAction' | 'setTieredActionStep' | 'upgradeModule' | 'resetProgress' |
  'toggleBlueprintOwned' | 'setBlueprintOwned' | 'setFilterHideOwnedBlueprints'
>;

export const createProgressSlice: StateCreator<AppState, [], [], ProgressSlice> = (set, get) => ({
  hideoutLevels: bootProfileState.hideoutLevels,
  targetLevels: bootProfileState.targetLevels,
  activeModules: bootProfileState.activeModules,
  checkedActions: bootProfileState.checkedActions,
  filterHideCompleted: bootProfileState.filterHideCompleted,
  listOrder: bootProfileState.listOrder,
  ownedBlueprints: bootProfileState.ownedBlueprints,
  filterHideOwnedBlueprints: bootProfileState.filterHideOwnedBlueprints,

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
    } else if (list && level < prevLevel) {
      list.levels
        .filter(l => l.level > level && l.level <= prevLevel)
        .forEach(l => {
          (l.actions ?? []).forEach(a => {
            delete checkedActions[`${moduleId}|${l.level}|${a.id}`];
          });
        });
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

  setTieredActionStep: (listId, level, tieredActionId, steps, stepIndex) => {
    const s = get();
    const checkedActions = { ...s.checkedActions };
    const stepKey = (stepId: string) => `${listId}|${level}|${tieredActionId}:${stepId}`;

    const targetStep = steps[stepIndex];
    if (!targetStep) return;

    const isTargetChecked = Boolean(checkedActions[stepKey(targetStep.id)]);
    const isNextChecked = stepIndex + 1 < steps.length && Boolean(checkedActions[stepKey(steps[stepIndex + 1].id)]);

    if (!isTargetChecked) {
      // Check all steps up to stepIndex
      for (let i = 0; i <= stepIndex; i++) {
        checkedActions[stepKey(steps[i].id)] = true;
      }
    } else if (isNextChecked) {
      // Target is checked and subsequent steps are also checked -> keep up to stepIndex, uncheck after
      for (let i = stepIndex + 1; i < steps.length; i++) {
        delete checkedActions[stepKey(steps[i].id)];
      }
    } else {
      // Target is checked and next is NOT checked -> uncheck target step and any subsequent
      for (let i = stepIndex; i < steps.length; i++) {
        delete checkedActions[stepKey(steps[i].id)];
      }
    }

    set({ checkedActions });
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
      ownedBlueprints: {},
      filterHideOwnedBlueprints: false,
    });
  },

  toggleBlueprintOwned: (id) => {
    const s = get();
    set({ ownedBlueprints: { ...s.ownedBlueprints, [id]: !s.ownedBlueprints[id] } });
  },

  setBlueprintOwned: (id, owned) => {
    const s = get();
    set({ ownedBlueprints: { ...s.ownedBlueprints, [id]: owned } });
  },

  setFilterHideOwnedBlueprints: (hide) => {
    set({ filterHideOwnedBlueprints: hide });
  },
});
