import { create } from 'zustand';
import type { AppState, ItemInfo, List, ListExportFile, MultiProfileExportFile, Profile, ProfileExportEntry } from './types';
import {
  isObject, sanitizeBoolRecord, sanitizeNumberRecord, sanitizeStringArray, validateList, validateProfile,
} from './lib/validate';
import workbenchesData from './data/workbenches.json';
import itemsData from './data/items.json';

// Per-profile state: each profile has its own key in localStorage.
// Global (cross-profile) data uses separate keys.
const PROFILES_KEY = 'arc-raiders-tracker-profiles';
const SHARED_LISTS_KEY = 'arc-raiders-tracker-shared-lists';
const LEGACY_KEY = 'arc-raiders-tracker-storage'; // migrated from single-profile era
const profileKey = (id: string) => `arc-raiders-tracker-${id}`;

type PersistedState = Pick<AppState,
  'hideoutLevels' | 'targetLevels' | 'activeModules' | 'inventory' |
  'filterHideCompleted' | 'listOrder' | 'customLists' | 'checkedActions'
>;

interface ProfilesMeta { profiles: Profile[]; activeProfileId: string; }

// ---------------------------------------------------------------------------
// Low-level storage helpers — all wrapped in try/catch for iframe contexts
// ---------------------------------------------------------------------------

function ls<T>(fn: () => T, fallback: T): T {
  try { return fn(); } catch { return fallback; }
}

function loadProfilesMeta(): ProfilesMeta | null {
  return ls(() => {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed) || !Array.isArray(parsed.profiles)) return null;
    const profiles = parsed.profiles.map(validateProfile).filter((p): p is Profile => p !== null);
    if (profiles.length === 0) return null;
    // Fall back to the first profile if the saved active id is stale/missing.
    const activeProfileId =
      typeof parsed.activeProfileId === 'string' && profiles.some(p => p.id === parsed.activeProfileId)
        ? parsed.activeProfileId
        : profiles[0].id;
    return { profiles, activeProfileId };
  }, null);
}

function saveProfilesMeta(meta: ProfilesMeta) {
  ls(() => localStorage.setItem(PROFILES_KEY, JSON.stringify(meta)), undefined);
}

/** Sanitize an untrusted parsed object into a clean partial persisted state.
 *  `targetLevels` keeps its raw (number | number[]) shape for migrateTargets to normalize. */
function sanitizeProfileState(raw: unknown): Partial<PersistedState> {
  if (!isObject(raw)) return {};
  const out: Partial<PersistedState> = {};
  if (isObject(raw.hideoutLevels)) out.hideoutLevels = sanitizeNumberRecord(raw.hideoutLevels);
  // migrateTargets() validates/normalizes element shapes; keep the raw object here.
  if (isObject(raw.targetLevels)) out.targetLevels = raw.targetLevels as Record<string, number[]>;
  if (isObject(raw.activeModules)) out.activeModules = sanitizeBoolRecord(raw.activeModules);
  if (isObject(raw.inventory)) out.inventory = sanitizeNumberRecord(raw.inventory);
  if (typeof raw.filterHideCompleted === 'boolean') out.filterHideCompleted = raw.filterHideCompleted;
  if (Array.isArray(raw.listOrder)) out.listOrder = sanitizeStringArray(raw.listOrder);
  if (Array.isArray(raw.customLists))
    out.customLists = raw.customLists.map(validateList).filter((l): l is List => l !== null);
  if (isObject(raw.checkedActions)) out.checkedActions = sanitizeBoolRecord(raw.checkedActions);
  return out;
}

function loadProfileState(profileId: string): Partial<PersistedState> {
  return ls(() => {
    const raw = localStorage.getItem(profileKey(profileId));
    if (raw) return sanitizeProfileState(JSON.parse(raw));
    // First migration: default profile inherits the legacy single-profile key
    if (profileId === 'default') {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) return sanitizeProfileState(JSON.parse(legacy));
    }
    return {};
  }, {});
}

function saveProfileState(profileId: string, s: PersistedState) {
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
  ls(() => localStorage.setItem(profileKey(profileId), JSON.stringify(slice)), undefined);
}

function loadSharedLists(): List[] {
  return ls(() => {
    const parsed: unknown = JSON.parse(localStorage.getItem(SHARED_LISTS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.map(validateList).filter((l): l is List => l !== null) : [];
  }, []);
}

function saveSharedLists(lists: List[]) {
  ls(() => localStorage.setItem(SHARED_LISTS_KEY, JSON.stringify(lists)), undefined);
}

// ---------------------------------------------------------------------------
// Boot: resolve profiles (or migrate from legacy single-profile storage)
// ---------------------------------------------------------------------------

function initProfilesMeta(): ProfilesMeta {
  const saved = loadProfilesMeta();
  if (saved) return saved;
  const meta: ProfilesMeta = {
    profiles: [{ id: 'default', name: 'Principale' }],
    activeProfileId: 'default',
  };
  saveProfilesMeta(meta);
  return meta;
}

// ---------------------------------------------------------------------------
// Game data
// ---------------------------------------------------------------------------

const workbenches = (workbenchesData.items as List[]).filter(w => w.maxLevel > 0);
const itemsInfo = itemsData as Record<string, ItemInfo>;

const levelsAbove = (current: number, max: number): number[] => {
  const r: number[] = [];
  for (let l = current + 1; l <= max; l++) r.push(l);
  return r;
};

const migrateTargets = (
  savedTargets: Record<string, number | number[]> | undefined,
  savedHideout: Record<string, number> | undefined,
): Record<string, number[]> => {
  const out: Record<string, number[]> = {};
  if (!savedTargets) return out;
  for (const [id, val] of Object.entries(savedTargets)) {
    if (Array.isArray(val)) out[id] = val.filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0);
    else if (typeof val === 'number') out[id] = levelsAbove(savedHideout?.[id] ?? 0, val);
  }
  return out;
};

// Default progress state for the game workbenches (used on fresh profile + resetProgress).
const defaultHideoutLevels: Record<string, number> = {};
const defaultTargetLevels: Record<string, number[]> = {};
const defaultActiveModules: Record<string, boolean> = {};
workbenches.forEach(w => {
  const cur = w.id === 'scrappy' ? 1 : 0;
  defaultHideoutLevels[w.id] = cur;
  defaultTargetLevels[w.id] = levelsAbove(cur, w.maxLevel);
  defaultActiveModules[w.id] = true;
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

const { profiles, activeProfileId } = initProfilesMeta();
const saved = loadProfileState(activeProfileId);
const sharedCustomLists = loadSharedLists();

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>()((set, get) => ({
  workbenches,
  customLists: saved.customLists ?? [],
  sharedCustomLists,
  itemsInfo,
  profiles,
  activeProfileId,

  hideoutLevels: { ...defaultHideoutLevels, ...saved.hideoutLevels },
  targetLevels: {
    ...defaultTargetLevels,
    ...migrateTargets(
      saved.targetLevels as Record<string, number | number[]> | undefined,
      saved.hideoutLevels,
    ),
  },
  activeModules: { ...defaultActiveModules, ...saved.activeModules },
  inventory: saved.inventory ?? {},
  filterHideCompleted: saved.filterHideCompleted ?? true,
  listOrder: saved.listOrder ?? workbenches.map(w => w.id),
  checkedActions: saved.checkedActions ?? {},

  // ---- Inventory ----------------------------------------------------------

  incrementItem: (itemId) => {
    const s = get();
    const inventory = { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + 1 };
    set({ inventory });
    saveProfileState(s.activeProfileId, { ...s, inventory });
  },

  decrementItem: (itemId) => {
    const s = get();
    const inventory = { ...s.inventory, [itemId]: Math.max(0, (s.inventory[itemId] ?? 0) - 1) };
    set({ inventory });
    saveProfileState(s.activeProfileId, { ...s, inventory });
  },

  setItemCount: (itemId, val) => {
    const s = get();
    const inventory = { ...s.inventory, [itemId]: Math.max(0, val) };
    set({ inventory });
    saveProfileState(s.activeProfileId, { ...s, inventory });
  },

  // ---- Progress -----------------------------------------------------------

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
    saveProfileState(s.activeProfileId, { ...s, hideoutLevels, inventory, checkedActions, targetLevels });
  },

  toggleTargetLevel: (moduleId, level) => {
    const s = get();
    const cur = s.targetLevels[moduleId] ?? [];
    const next = cur.includes(level)
      ? cur.filter(l => l !== level)
      : [...cur, level].sort((a, b) => a - b);
    const targetLevels = { ...s.targetLevels, [moduleId]: next };
    set({ targetLevels });
    saveProfileState(s.activeProfileId, { ...s, targetLevels });
  },

  toggleModuleActive: (moduleId) => {
    const s = get();
    const activeModules = { ...s.activeModules, [moduleId]: !s.activeModules[moduleId] };
    set({ activeModules });
    saveProfileState(s.activeProfileId, { ...s, activeModules });
  },

  setFilterHideCompleted: (val) => {
    const s = get();
    set({ filterHideCompleted: val });
    saveProfileState(s.activeProfileId, { ...s, filterHideCompleted: val });
  },

  setListOrder: (order) => {
    const s = get();
    set({ listOrder: order });
    saveProfileState(s.activeProfileId, { ...s, listOrder: order });
  },

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
      const sharedCustomLists = [...s.sharedCustomLists, list];
      set({ sharedCustomLists, hideoutLevels, targetLevels, activeModules, listOrder });
      saveSharedLists(sharedCustomLists);
      saveProfileState(s.activeProfileId, { ...s, hideoutLevels, targetLevels, activeModules, listOrder });
    } else {
      const customLists = [...s.customLists, list];
      set({ customLists, hideoutLevels, targetLevels, activeModules, listOrder });
      saveProfileState(s.activeProfileId, { ...s, customLists, hideoutLevels, targetLevels, activeModules, listOrder });
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
      saveSharedLists(sharedCustomLists);
      saveProfileState(s.activeProfileId, { ...s, hideoutLevels, targetLevels });
    } else {
      const customLists = [...s.customLists];
      customLists[idx] = updated;
      set({ customLists, hideoutLevels, targetLevels });
      saveProfileState(s.activeProfileId, { ...s, customLists, hideoutLevels, targetLevels });
    }
  },

  toggleAction: (listId, level, actionId) => {
    const s = get();
    const key = `${listId}|${level}|${actionId}`;
    const checkedActions = { ...s.checkedActions, [key]: !s.checkedActions[key] };
    set({ checkedActions });
    saveProfileState(s.activeProfileId, { ...s, checkedActions });
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
    saveSharedLists(sharedCustomLists);
    saveProfileState(s.activeProfileId, { ...s, customLists, hideoutLevels, targetLevels, activeModules, listOrder, inventory });
  },

  deleteCustomList: (id) => {
    const s = get();
    const isShared = s.sharedCustomLists.some(l => l.id === id);
    const hideoutLevels = { ...s.hideoutLevels }; delete hideoutLevels[id];
    const targetLevels = { ...s.targetLevels }; delete targetLevels[id];
    const activeModules = { ...s.activeModules }; delete activeModules[id];
    const listOrder = s.listOrder.filter(x => x !== id);

    if (isShared) {
      const sharedCustomLists = s.sharedCustomLists.filter(l => l.id !== id);
      set({ sharedCustomLists, hideoutLevels, targetLevels, activeModules, listOrder });
      saveSharedLists(sharedCustomLists);
      saveProfileState(s.activeProfileId, { ...s, hideoutLevels, targetLevels, activeModules, listOrder });
    } else {
      const customLists = s.customLists.filter(l => l.id !== id);
      set({ customLists, hideoutLevels, targetLevels, activeModules, listOrder });
      saveProfileState(s.activeProfileId, { ...s, customLists, hideoutLevels, targetLevels, activeModules, listOrder });
    }
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
    saveProfileState(s.activeProfileId, fresh);
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
    saveProfileState(s.activeProfileId, { ...s, inventory, hideoutLevels, checkedActions, targetLevels });
  },

  buildExportData: (profileIds) => {
    const s = get();
    const profiles: ProfileExportEntry[] = [];

    for (const profileId of profileIds) {
      const profile = s.profiles.find(p => p.id === profileId);
      if (!profile) continue;

      let customLists: List[];
      let hideoutLevels: Record<string, number>;
      let targetLevels: Record<string, number[]>;
      let activeModules: Record<string, boolean>;
      let inventory: Record<string, number>;

      if (profileId === s.activeProfileId) {
        customLists = s.customLists;
        hideoutLevels = s.hideoutLevels;
        targetLevels = s.targetLevels;
        activeModules = s.activeModules;
        inventory = s.inventory;
      } else {
        const state = loadProfileState(profileId);
        customLists = state.customLists ?? [];
        hideoutLevels = state.hideoutLevels ?? {};
        targetLevels = migrateTargets(
          state.targetLevels as Record<string, number | number[]> | undefined,
          state.hideoutLevels,
        );
        activeModules = state.activeModules ?? {};
        inventory = state.inventory ?? {};
      }

      const allLists: List[] = [...s.workbenches, ...s.sharedCustomLists, ...customLists];
      profiles.push({
        profile,
        inventory,
        lists: allLists.map(list => ({
          list,
          currentLevel: hideoutLevels[list.id] ?? 0,
          targetLevels: targetLevels[list.id] ?? list.levels.map(l => l.level),
          active: activeModules[list.id] ?? true,
        })),
      });
    }

    return { sharedLists: s.sharedCustomLists, profiles };
  },

  importMultiProfile: (data: MultiProfileExportFile, selectedProfileIds: string[]) => {
    const s = get();

    // Merge shared lists globally
    const sharedCustomLists = [...s.sharedCustomLists];
    for (const list of data.sharedLists) {
      const idx = sharedCustomLists.findIndex(l => l.id === list.id);
      if (idx >= 0) sharedCustomLists[idx] = list;
      else sharedCustomLists.push(list);
    }
    saveSharedLists(sharedCustomLists);

    let profiles = [...s.profiles];
    let activeProfileState: PersistedState | null = null;

    for (const entry of data.profiles) {
      if (!selectedProfileIds.includes(entry.profile.id)) continue;

      const customLists: List[] = [];
      const hideoutLevels: Record<string, number> = {};
      const targetLevels: Record<string, number[]> = {};
      const activeModules: Record<string, boolean> = {};
      const listOrder: string[] = [];

      for (const listEntry of entry.lists) {
        const { list, currentLevel, targetLevels: entryTargets, active } = listEntry;
        const isGameList = s.workbenches.some(w => w.id === list.id);
        const isSharedList = data.sharedLists.some(l => l.id === list.id);
        if (!isGameList && !isSharedList && list.custom) customLists.push(list);
        hideoutLevels[list.id] = currentLevel;
        targetLevels[list.id] = entryTargets;
        activeModules[list.id] = active;
        listOrder.push(list.id);
      }

      const profileState: PersistedState = {
        hideoutLevels,
        targetLevels,
        activeModules,
        inventory: entry.inventory,
        filterHideCompleted: true,
        listOrder,
        customLists,
        checkedActions: {},
      };

      if (!profiles.some(p => p.id === entry.profile.id)) {
        profiles = [...profiles, entry.profile];
      }

      saveProfileState(entry.profile.id, profileState);

      if (entry.profile.id === s.activeProfileId) {
        activeProfileState = profileState;
      }
    }

    saveProfilesMeta({ profiles, activeProfileId: s.activeProfileId });

    if (activeProfileState) {
      set({ profiles, sharedCustomLists, ...activeProfileState });
    } else {
      set({ profiles, sharedCustomLists });
    }
  },

  // ---- Profiles -----------------------------------------------------------

  createProfile: (name: string) => {
    const s = get();
    saveProfileState(s.activeProfileId, s); // persist current before switching

    const id = crypto.randomUUID();
    const profiles = [...s.profiles, { id, name }];
    const fresh: PersistedState = {
      hideoutLevels: {},
      targetLevels: {},
      activeModules: {},
      inventory: {},
      filterHideCompleted: true,
      listOrder: workbenches.map(w => w.id),
      customLists: [],
      checkedActions: {},
    };
    saveProfileState(id, fresh);
    saveProfilesMeta({ profiles, activeProfileId: id });

    set({
      profiles,
      activeProfileId: id,
      hideoutLevels: { ...defaultHideoutLevels },
      targetLevels: { ...defaultTargetLevels },
      activeModules: { ...defaultActiveModules },
      inventory: {},
      filterHideCompleted: true,
      listOrder: workbenches.map(w => w.id),
      customLists: [],
      checkedActions: {},
    });
  },

  switchProfile: (newProfileId: string) => {
    const s = get();
    if (s.activeProfileId === newProfileId) return;
    saveProfileState(s.activeProfileId, s);

    const loaded = loadProfileState(newProfileId);
    saveProfilesMeta({ profiles: s.profiles, activeProfileId: newProfileId });

    set({
      activeProfileId: newProfileId,
      hideoutLevels: { ...defaultHideoutLevels, ...loaded.hideoutLevels },
      targetLevels: {
        ...defaultTargetLevels,
        ...migrateTargets(
          loaded.targetLevels as Record<string, number | number[]> | undefined,
          loaded.hideoutLevels,
        ),
      },
      activeModules: { ...defaultActiveModules, ...loaded.activeModules },
      inventory: loaded.inventory ?? {},
      filterHideCompleted: loaded.filterHideCompleted ?? true,
      listOrder: loaded.listOrder ?? workbenches.map(w => w.id),
      customLists: loaded.customLists ?? [],
      checkedActions: loaded.checkedActions ?? {},
    });
  },

  renameProfile: (id: string, name: string) => {
    const s = get();
    const profiles = s.profiles.map(p => p.id === id ? { ...p, name } : p);
    set({ profiles });
    saveProfilesMeta({ profiles, activeProfileId: s.activeProfileId });
  },

  deleteProfile: (id: string) => {
    const s = get();
    if (s.profiles.length <= 1) return;
    ls(() => localStorage.removeItem(profileKey(id)), undefined);
    const profiles = s.profiles.filter(p => p.id !== id);

    if (s.activeProfileId === id) {
      const newActiveId = profiles[0].id;
      const loaded = loadProfileState(newActiveId);
      saveProfilesMeta({ profiles, activeProfileId: newActiveId });
      set({
        profiles,
        activeProfileId: newActiveId,
        hideoutLevels: { ...defaultHideoutLevels, ...loaded.hideoutLevels },
        targetLevels: {
          ...defaultTargetLevels,
          ...migrateTargets(
            loaded.targetLevels as Record<string, number | number[]> | undefined,
            loaded.hideoutLevels,
          ),
        },
        activeModules: { ...defaultActiveModules, ...loaded.activeModules },
        inventory: loaded.inventory ?? {},
        filterHideCompleted: loaded.filterHideCompleted ?? true,
        listOrder: loaded.listOrder ?? workbenches.map(w => w.id),
        customLists: loaded.customLists ?? [],
        checkedActions: loaded.checkedActions ?? {},
      });
    } else {
      saveProfilesMeta({ profiles, activeProfileId: s.activeProfileId });
      set({ profiles });
    }
  },

  // ---- Selectors ----------------------------------------------------------

  getAllLists: () => {
    const s = get();
    return [...s.workbenches, ...s.sharedCustomLists, ...s.customLists];
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
