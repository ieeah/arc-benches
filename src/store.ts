import { create } from 'zustand';
import type { AppState, ItemInfo, Workbench } from './types';
import workbenchesData from './data/workbenches.json';
import itemsData from './data/items.json';

const STORAGE_KEY = 'arc-raiders-tracker-storage';

type PersistedState = Pick<AppState, 'hideoutLevels' | 'targetLevels' | 'activeModules' | 'inventory' | 'filterHideCompleted' | 'workbenchOrder'>;

function load(): Partial<PersistedState> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}

function save(s: PersistedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* unavailable */ }
}

const workbenches = (workbenchesData.items as Workbench[]).filter(w => w.maxLevel > 0);
const itemsInfo = itemsData as Record<string, ItemInfo>;

const saved = load();

// Default state: all workbenches start at level 0, target = maxLevel, active = true
// Scrappy starts at level 1 (it begins unlocked in-game)
const defaultHideoutLevels: Record<string, number> = {};
const defaultTargetLevels: Record<string, number> = {};
const defaultActiveModules: Record<string, boolean> = {};
workbenches.forEach(w => {
  defaultHideoutLevels[w.id] = w.id === 'scrappy' ? 1 : 0;
  defaultTargetLevels[w.id] = w.maxLevel;
  defaultActiveModules[w.id] = true;
});

export const useAppStore = create<AppState>()((set, get) => ({
  workbenches,
  itemsInfo,
  hideoutLevels: { ...defaultHideoutLevels, ...saved.hideoutLevels },
  targetLevels: { ...defaultTargetLevels, ...saved.targetLevels },
  activeModules: { ...defaultActiveModules, ...saved.activeModules },
  inventory: saved.inventory ?? {},
  filterHideCompleted: saved.filterHideCompleted ?? true,
  workbenchOrder: saved.workbenchOrder ?? workbenches.map(w => w.id),

  incrementItem: (itemId) => {
    const s = get();
    const inventory = { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + 1 };
    set({ inventory });
    save({ ...s, inventory });
  },

  decrementItem: (itemId) => {
    const s = get();
    const inventory = { ...s.inventory, [itemId]: Math.max(0, (s.inventory[itemId] ?? 0) - 1) };
    set({ inventory });
    save({ ...s, inventory });
  },

  setItemCount: (itemId, val) => {
    const s = get();
    const inventory = { ...s.inventory, [itemId]: Math.max(0, val) };
    set({ inventory });
    save({ ...s, inventory });
  },

  setModuleCurrentLevel: (moduleId, level) => {
    const s = get();
    const hideoutLevels = { ...s.hideoutLevels, [moduleId]: level };
    // If the current level reaches the target, bump the target to the next level (or max)
    const targetLevels = { ...s.targetLevels };
    const max = s.workbenches.find(w => w.id === moduleId)?.maxLevel ?? level;
    if ((targetLevels[moduleId] ?? 0) <= level) targetLevels[moduleId] = Math.min(level + 1, max);
    set({ hideoutLevels, targetLevels });
    save({ ...s, hideoutLevels, targetLevels });
  },

  setModuleTargetLevel: (moduleId, level) => {
    const s = get();
    const targetLevels = { ...s.targetLevels, [moduleId]: level };
    set({ targetLevels });
    save({ ...s, targetLevels });
  },

  toggleModuleActive: (moduleId) => {
    const s = get();
    const activeModules = { ...s.activeModules, [moduleId]: !s.activeModules[moduleId] };
    set({ activeModules });
    save({ ...s, activeModules });
  },

  setFilterHideCompleted: (val) => {
    const s = get();
    set({ filterHideCompleted: val });
    save({ ...s, filterHideCompleted: val });
  },

  setWorkbenchOrder: (order) => {
    const s = get();
    set({ workbenchOrder: order });
    save({ ...s, workbenchOrder: order });
  },

  resetProgress: () => {
    const s = get();
    const fresh: PersistedState = {
      hideoutLevels: { ...defaultHideoutLevels },
      targetLevels: { ...defaultTargetLevels },
      activeModules: { ...defaultActiveModules },
      inventory: {},
      filterHideCompleted: true,
      workbenchOrder: s.workbenchOrder,
    };
    set(fresh);
    save(fresh);
  },

  upgradeModule: (moduleId) => {
    const s = get();
    const wb = s.workbenches.find(w => w.id === moduleId);
    if (!wb) return;
    const currentLevel = s.hideoutLevels[moduleId] ?? 0;
    if (currentLevel >= wb.maxLevel) return;
    const nextLevel = wb.levels.find(l => l.level === currentLevel + 1);
    if (!nextLevel) return;
    const inventory = { ...s.inventory };
    nextLevel.requirementItemIds.forEach(req => {
      inventory[req.itemId] = Math.max(0, (inventory[req.itemId] ?? 0) - req.quantity);
    });
    const newLevel = currentLevel + 1;
    const hideoutLevels = { ...s.hideoutLevels, [moduleId]: newLevel };
    const targetLevels = { ...s.targetLevels };
    if ((targetLevels[moduleId] ?? 0) <= newLevel) targetLevels[moduleId] = Math.min(newLevel + 1, wb.maxLevel);
    set({ inventory, hideoutLevels, targetLevels });
    save({ ...s, inventory, hideoutLevels, targetLevels });
  },

  getTotalRequiredMaterials: () => {
    const s = get();
    const total: Record<string, number> = {};
    s.workbenches.forEach(wb => {
      if (!s.activeModules[wb.id]) return;
      const current = s.hideoutLevels[wb.id] ?? 0;
      const target = s.targetLevels[wb.id] ?? 0;
      wb.levels.forEach(lvl => {
        if (lvl.level > current && lvl.level <= target) {
          lvl.requirementItemIds.forEach(req => {
            total[req.itemId] = (total[req.itemId] ?? 0) + req.quantity;
          });
        }
      });
    });
    return total;
  },

  getMissingMaterials: () => {
    const s = get();
    const required = s.getTotalRequiredMaterials();
    return Object.entries(required).map(([itemId, reqQty]) => {
      const owned = s.inventory[itemId] ?? 0;
      return { itemId, owned, required: reqQty, missing: Math.max(0, reqQty - owned), isCompleted: owned >= reqQty };
    });
  },

  getAvailableUpgrades: () => {
    const s = get();
    return s.workbenches
      .filter(wb => {
        if (!s.activeModules[wb.id]) return false;
        const current = s.hideoutLevels[wb.id] ?? 0;
        if (current >= wb.maxLevel) return false;
        const nextLevel = wb.levels.find(l => l.level === current + 1);
        if (!nextLevel) return false;
        return nextLevel.requirementItemIds.every(req => (s.inventory[req.itemId] ?? 0) >= req.quantity);
      })
      .map(wb => wb.id);
  },
}));
