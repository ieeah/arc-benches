import { create } from 'zustand';
import type { AppState, ItemInfo, List, ListExportFile } from './types';
import workbenchesData from './data/workbenches.json';
import itemsData from './data/items.json';

const STORAGE_KEY = 'arc-raiders-tracker-storage';

type PersistedState = Pick<AppState, 'hideoutLevels' | 'targetLevels' | 'activeModules' | 'inventory' | 'filterHideCompleted' | 'listOrder' | 'customLists' | 'checkedActions'>;

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
    checkedActions: s.checkedActions,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slice)); } catch { /* unavailable */ }
}

const workbenches = (workbenchesData.items as List[]).filter(w => w.maxLevel > 0);
const itemsInfo = itemsData as Record<string, ItemInfo>;

// Inclusive list of levels strictly above `current` up to `max` — the default objective set
// ("track everything not yet done").
const levelsAbove = (current: number, max: number): number[] => {
  const r: number[] = [];
  for (let l = current + 1; l <= max; l++) r.push(l);
  return r;
};

// Migrate persisted targetLevels: the legacy format stored a single ceiling number per list;
// the new format stores the set of selected levels. number → [current+1 … number].
const migrateTargets = (
  savedTargets: Record<string, number | number[]> | undefined,
  savedHideout: Record<string, number> | undefined,
): Record<string, number[]> => {
  const out: Record<string, number[]> = {};
  if (!savedTargets) return out;
  for (const [id, val] of Object.entries(savedTargets)) {
    if (Array.isArray(val)) out[id] = val;
    else if (typeof val === 'number') out[id] = levelsAbove(savedHideout?.[id] ?? 0, val);
  }
  return out;
};

const saved = load();

// Default state: all workbenches start at level 0, all levels above selected as objectives, active.
// Scrappy starts at level 1 (it begins unlocked in-game).
const defaultHideoutLevels: Record<string, number> = {};
const defaultTargetLevels: Record<string, number[]> = {};
const defaultActiveModules: Record<string, boolean> = {};
workbenches.forEach(w => {
  const cur = w.id === 'scrappy' ? 1 : 0;
  defaultHideoutLevels[w.id] = cur;
  defaultTargetLevels[w.id] = levelsAbove(cur, w.maxLevel);
  defaultActiveModules[w.id] = true;
});

const savedCustomLists = saved.customLists ?? [];

export const useAppStore = create<AppState>()((set, get) => ({
  workbenches,
  customLists: savedCustomLists,
  itemsInfo,
  hideoutLevels: { ...defaultHideoutLevels, ...saved.hideoutLevels },
  targetLevels: { ...defaultTargetLevels, ...migrateTargets(saved.targetLevels as Record<string, number | number[]> | undefined, saved.hideoutLevels) },
  activeModules: { ...defaultActiveModules, ...saved.activeModules },
  inventory: saved.inventory ?? {},
  filterHideCompleted: saved.filterHideCompleted ?? true,
  listOrder: saved.listOrder ?? workbenches.map(w => w.id),
  checkedActions: saved.checkedActions ?? {},

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

    // Raising the level marks the newly completed levels as done: deduct their materials (optional,
    // clamped to 0) and auto-check their actions. Both stay user-correctable afterwards.
    // Lowering a level never refunds: it's always a tracking correction.
    const inventory = { ...s.inventory };
    const checkedActions = { ...s.checkedActions };
    // Target levels are an explicit visibility set independent of the current level, except for
    // one convenience: raising the current level auto-selects the next level as the new objective.
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
    save({ ...s, hideoutLevels, inventory, checkedActions, targetLevels });
  },

  toggleTargetLevel: (moduleId, level) => {
    const s = get();
    const cur = s.targetLevels[moduleId] ?? [];
    const next = cur.includes(level)
      ? cur.filter(l => l !== level)
      : [...cur, level].sort((a, b) => a - b);
    const targetLevels = { ...s.targetLevels, [moduleId]: next };
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
    const targetLevels = { ...s.targetLevels, [id]: levelsAbove(0, maxLevel) };
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
    // Clamp current to the (possibly shrunk) maxLevel; drop objective levels that no longer exist.
    const hideoutLevels = { ...s.hideoutLevels, [id]: Math.min(s.hideoutLevels[id] ?? 0, maxLevel) };
    const prevTargets = s.targetLevels[id] ?? levelsAbove(0, maxLevel);
    const targetLevels = { ...s.targetLevels, [id]: prevTargets.filter(l => l <= maxLevel) };
    set({ customLists, hideoutLevels, targetLevels });
    save({ ...s, customLists, hideoutLevels, targetLevels });
  },

  toggleAction: (listId, level, actionId) => {
    const s = get();
    const key = `${listId}|${level}|${actionId}`;
    const checkedActions = { ...s.checkedActions, [key]: !s.checkedActions[key] };
    set({ checkedActions });
    save({ ...s, checkedActions });
  },

  importLists: (data: ListExportFile) => {
    const s = get();
    const customLists = [...s.customLists];
    const hideoutLevels = { ...s.hideoutLevels };
    const targetLevels = { ...s.targetLevels };
    const activeModules = { ...s.activeModules };
    const listOrder = [...s.listOrder];
    for (const entry of data.lists) {
      const { list, currentLevel, targetLevels: entryTargets, active } = entry;
      // Game workbenches: apply state only (definition is the app seed, not overridable)
      const isGameList = s.workbenches.some(w => w.id === list.id);
      if (!isGameList) {
        const idx = customLists.findIndex(l => l.id === list.id);
        if (idx >= 0) {
          customLists[idx] = list;
        } else {
          customLists.push(list);
          listOrder.push(list.id);
        }
      }
      hideoutLevels[list.id] = currentLevel;
      targetLevels[list.id] = entryTargets;
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
      targetLevels[l.id] = levelsAbove(0, l.maxLevel);
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
      checkedActions: {},
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
    const checkedActions = { ...s.checkedActions };
    (nextLevel.actions ?? []).forEach(a => { checkedActions[`${moduleId}|${newLevel}|${a.id}`] = true; });
    // Auto-select the next level as the new objective (mirrors setModuleCurrentLevel).
    const targetLevels = { ...s.targetLevels };
    const next = newLevel + 1;
    const cur = targetLevels[moduleId] ?? [];
    if (next <= list.maxLevel && !cur.includes(next)) targetLevels[moduleId] = [...cur, next].sort((a, b) => a - b);
    set({ inventory, hideoutLevels, checkedActions, targetLevels });
    save({ ...s, inventory, hideoutLevels, checkedActions, targetLevels });
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
      const selected = s.targetLevels[list.id] ?? [];
      list.levels.forEach(lvl => {
        if (lvl.level > current && selected.includes(lvl.level)) {
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
