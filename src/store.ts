import { create } from 'zustand';
import type { AppState, ItemInfo, List, ListExportFile } from './types';
import workbenchesData from './data/workbenches.json';
import itemsData from './data/items.json';

const STORAGE_KEY = 'arc-raiders-tracker-storage';

type PersistedState = Pick<AppState, 'hideoutLevels' | 'targetLevels' | 'activeModules' | 'inventory' | 'filterHideCompleted' | 'listOrder' | 'customLists'>;

function load(): Partial<PersistedState> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}

// Persist ONLY the persisted slice — never the game seed (workbenches/itemsInfo) which is large
// and read-only. Call sites pass the full state plus overrides; we pick the keys explicitly.
function save(s: PersistedState) {
  const slice: PersistedState = {
    hideoutLevels: s.hideoutLevels,
    targetLevels: s.targetLevels,
    activeModules: s.activeModules,
    inventory: s.inventory,
    filterHideCompleted: s.filterHideCompleted,
    listOrder: s.listOrder,
    customLists: s.customLists,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slice)); } catch { /* unavailable */ }
}

const workbenches = (workbenchesData.items as List[]).filter(w => w.maxLevel > 0);
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

const savedCustomLists = saved.customLists ?? [];

export const useAppStore = create<AppState>()((set, get) => ({
  workbenches,
  customLists: savedCustomLists,
  itemsInfo,
  hideoutLevels: { ...defaultHideoutLevels, ...saved.hideoutLevels },
  targetLevels: { ...defaultTargetLevels, ...saved.targetLevels },
  activeModules: { ...defaultActiveModules, ...saved.activeModules },
  inventory: saved.inventory ?? {},
  filterHideCompleted: saved.filterHideCompleted ?? true,
  listOrder: saved.listOrder ?? workbenches.map(w => w.id),

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

  setModuleCurrentLevel: (moduleId, level, deductMaterials = false) => {
    const s = get();
    const list = s.getAllLists().find(w => w.id === moduleId);
    const prevLevel = s.hideoutLevels[moduleId] ?? 0;
    const hideoutLevels = { ...s.hideoutLevels, [moduleId]: level };

    // Optionally deduct the requirements of the newly completed levels (clamped to 0).
    // Lowering a level never refunds: it's always a tracking correction.
    const inventory = { ...s.inventory };
    if (deductMaterials && list && level > prevLevel) {
      list.levels
        .filter(l => l.level > prevLevel && l.level <= level)
        .forEach(l => l.requirementItemIds.forEach(req => {
          inventory[req.itemId] = Math.max(0, (inventory[req.itemId] ?? 0) - req.quantity);
        }));
    }

    // If the current level reaches the target, bump the target to the next level (or max)
    const targetLevels = { ...s.targetLevels };
    const max = list?.maxLevel ?? level;
    if ((targetLevels[moduleId] ?? 0) <= level) targetLevels[moduleId] = Math.min(level + 1, max);

    set({ hideoutLevels, targetLevels, inventory });
    save({ ...s, hideoutLevels, targetLevels, inventory });
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

  setListOrder: (order) => {
    const s = get();
    set({ listOrder: order });
    save({ ...s, listOrder: order });
  },

  createCustomList: ({ name, levels, listType }) => {
    const s = get();
    const id = `custom:${crypto.randomUUID()}`;
    const maxLevel = levels.length ? Math.max(...levels.map(l => l.level)) : 1;
    const list: List = { id, name, maxLevel, levels, custom: true, listType: listType ?? 'custom' };
    const customLists = [...s.customLists, list];
    const hideoutLevels = { ...s.hideoutLevels, [id]: 0 };
    const targetLevels = { ...s.targetLevels, [id]: maxLevel };
    const activeModules = { ...s.activeModules, [id]: true };
    const listOrder = [...s.listOrder, id];
    set({ customLists, hideoutLevels, targetLevels, activeModules, listOrder });
    save({ ...s, customLists, hideoutLevels, targetLevels, activeModules, listOrder });
    return id;
  },

  updateCustomList: (id, patch) => {
    const s = get();
    const idx = s.customLists.findIndex(l => l.id === id);
    if (idx === -1) return;
    const prev = s.customLists[idx];
    const levels = patch.levels ?? prev.levels;
    const maxLevel = levels.length ? Math.max(...levels.map(l => l.level)) : 1;
    const customLists = [...s.customLists];
    customLists[idx] = {
      ...prev,
      name: patch.name ?? prev.name,
      listType: patch.listType ?? prev.listType,
      levels,
      maxLevel,
    };
    // Clamp current/target to the (possibly shrunk) maxLevel
    const hideoutLevels = { ...s.hideoutLevels, [id]: Math.min(s.hideoutLevels[id] ?? 0, maxLevel) };
    const targetLevels = { ...s.targetLevels, [id]: Math.min(s.targetLevels[id] ?? maxLevel, maxLevel) };
    set({ customLists, hideoutLevels, targetLevels });
    save({ ...s, customLists, hideoutLevels, targetLevels });
  },

  importCustomLists: (data: ListExportFile) => {
    const s = get();
    const customLists = [...s.customLists];
    const hideoutLevels = { ...s.hideoutLevels };
    const targetLevels = { ...s.targetLevels };
    const activeModules = { ...s.activeModules };
    const listOrder = [...s.listOrder];
    for (const entry of data.lists) {
      const { list, currentLevel, targetLevel, active } = entry;
      const idx = customLists.findIndex(l => l.id === list.id);
      if (idx >= 0) {
        customLists[idx] = list;
      } else {
        customLists.push(list);
        listOrder.push(list.id);
      }
      hideoutLevels[list.id] = currentLevel;
      targetLevels[list.id] = targetLevel;
      activeModules[list.id] = active;
    }
    set({ customLists, hideoutLevels, targetLevels, activeModules, listOrder });
    save({ ...s, customLists, hideoutLevels, targetLevels, activeModules, listOrder });
  },

  deleteCustomList: (id) => {
    const s = get();
    const customLists = s.customLists.filter(l => l.id !== id);
    const hideoutLevels = { ...s.hideoutLevels }; delete hideoutLevels[id];
    const targetLevels = { ...s.targetLevels }; delete targetLevels[id];
    const activeModules = { ...s.activeModules }; delete activeModules[id];
    const listOrder = s.listOrder.filter(x => x !== id);
    set({ customLists, hideoutLevels, targetLevels, activeModules, listOrder });
    save({ ...s, customLists, hideoutLevels, targetLevels, activeModules, listOrder });
  },

  resetProgress: () => {
    const s = get();
    // Reset progress only — keep user-created lists, but reset their levels to defaults too.
    const hideoutLevels = { ...defaultHideoutLevels };
    const targetLevels = { ...defaultTargetLevels };
    const activeModules = { ...defaultActiveModules };
    s.customLists.forEach(l => {
      hideoutLevels[l.id] = 0;
      targetLevels[l.id] = l.maxLevel;
      activeModules[l.id] = true;
    });
    const fresh: PersistedState = {
      hideoutLevels,
      targetLevels,
      activeModules,
      inventory: {},
      filterHideCompleted: true,
      listOrder: s.listOrder,
      customLists: s.customLists,
    };
    set(fresh);
    save(fresh);
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
    const targetLevels = { ...s.targetLevels };
    if ((targetLevels[moduleId] ?? 0) <= newLevel) targetLevels[moduleId] = Math.min(newLevel + 1, list.maxLevel);
    set({ inventory, hideoutLevels, targetLevels });
    save({ ...s, inventory, hideoutLevels, targetLevels });
  },

  getAllLists: () => {
    const s = get();
    return [...s.workbenches, ...s.customLists];
  },

  getOrderedLists: () => {
    const s = get();
    return s.getAllLists().sort((a, b) => {
      const oa = s.listOrder.indexOf(a.id);
      const ob = s.listOrder.indexOf(b.id);
      return (oa === -1 ? 999 : oa) - (ob === -1 ? 999 : ob);
    });
  },

  getTotalRequiredMaterials: (excludeModuleId) => {
    const s = get();
    const total: Record<string, number> = {};
    s.getAllLists().forEach(list => {
      if (list.id === excludeModuleId || !s.activeModules[list.id]) return;
      const current = s.hideoutLevels[list.id] ?? 0;
      const target = s.targetLevels[list.id] ?? 0;
      list.levels.forEach(lvl => {
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
    return s.getAllLists()
      .filter(list => {
        if (!s.activeModules[list.id]) return false;
        const current = s.hideoutLevels[list.id] ?? 0;
        if (current >= list.maxLevel) return false;
        const nextLevel = list.levels.find(l => l.level === current + 1);
        if (!nextLevel) return false;
        return nextLevel.requirementItemIds.every(req => (s.inventory[req.itemId] ?? 0) >= req.quantity);
      })
      .map(list => list.id);
  },
}));
