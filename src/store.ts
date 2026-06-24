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

// Build the full in-memory state for a profile from its (partial) persisted slice.
const hydrateProfile = (loaded: Partial<PersistedState>): PersistedState => ({
  hideoutLevels: { ...defaultHideoutLevels, ...loaded.hideoutLevels },
  targetLevels: {
    ...defaultTargetLevels,
    ...migrateTargets(loaded.targetLevels as Record<string, number | number[]> | undefined, loaded.hideoutLevels),
  },
  activeModules: { ...defaultActiveModules, ...loaded.activeModules },
  inventory: loaded.inventory ?? {},
  filterHideCompleted: loaded.filterHideCompleted ?? true,
  listOrder: loaded.listOrder ?? workbenches.map(w => w.id),
  customLists: loaded.customLists ?? [],
  checkedActions: loaded.checkedActions ?? {},
});

// Fresh (empty) progress for a brand-new profile.
const freshProfile = (): PersistedState => ({
  hideoutLevels: { ...defaultHideoutLevels },
  targetLevels: { ...defaultTargetLevels },
  activeModules: { ...defaultActiveModules },
  inventory: {},
  filterHideCompleted: true,
  listOrder: workbenches.map(w => w.id),
  customLists: [],
  checkedActions: {},
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

const { profiles, activeProfileId } = initProfilesMeta();
const sharedCustomLists = loadSharedLists();

// ---------------------------------------------------------------------------
// Store
//
// Persistence is NOT inlined in the actions: a single subscription below is the
// only writer for the active profile's state, the shared lists and the profiles
// meta (see the subscribe() call). Actions just call set(). Writes are synchronous
// (no debounce): a delayed write would corrupt data across a profile switch, and
// the remote-sync debounce (Fase 2) plugs into this same single boundary instead.
// Cross-profile writes that the subscriber cannot infer (writing a NON-active
// profile, removing a deleted profile's key) stay explicit in the profile actions.
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>()((set, get) => ({
  workbenches,
  sharedCustomLists,
  itemsInfo,
  profiles,
  activeProfileId,
  ...hydrateProfile(loadProfileState(activeProfileId)),

  // ---- Inventory ----------------------------------------------------------

  incrementItem: (itemId) => {
    const s = get();
    set({ inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + 1 } });
  },

  decrementItem: (itemId) => {
    const s = get();
    set({ inventory: { ...s.inventory, [itemId]: Math.max(0, (s.inventory[itemId] ?? 0) - 1) } });
  },

  setItemCount: (itemId, val) => {
    const s = get();
    set({ inventory: { ...s.inventory, [itemId]: Math.max(0, val) } });
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

  toggleAction: (listId, level, actionId) => {
    const s = get();
    const key = `${listId}|${level}|${actionId}`;
    set({ checkedActions: { ...s.checkedActions, [key]: !s.checkedActions[key] } });
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

  buildExportData: (profileIds) => {
    const s = get();
    const exported: ProfileExportEntry[] = [];

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
      exported.push({
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

    return { sharedLists: s.sharedCustomLists, profiles: exported };
  },

  importMultiProfile: (data: MultiProfileExportFile, selectedProfileIds: string[]) => {
    const s = get();

    // Merge shared lists globally (persisted by the subscriber via set below).
    const sharedCustomLists = [...s.sharedCustomLists];
    for (const list of data.sharedLists) {
      const idx = sharedCustomLists.findIndex(l => l.id === list.id);
      if (idx >= 0) sharedCustomLists[idx] = list;
      else sharedCustomLists.push(list);
    }

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
        hideoutLevels, targetLevels, activeModules,
        inventory: entry.inventory,
        filterHideCompleted: true, listOrder, customLists, checkedActions: {},
      };

      if (!profiles.some(p => p.id === entry.profile.id)) profiles = [...profiles, entry.profile];

      if (entry.profile.id === s.activeProfileId) {
        activeProfileState = profileState; // active profile persisted via the subscriber (set below)
      } else {
        saveProfileState(entry.profile.id, profileState); // non-active: write directly
      }
    }

    // The subscriber persists sharedCustomLists, the profiles meta and (if changed) the active state.
    if (activeProfileState) {
      set({ profiles, sharedCustomLists, ...activeProfileState });
    } else {
      set({ profiles, sharedCustomLists });
    }
  },

  // ---- Profiles -----------------------------------------------------------
  // The subscriber persists the new active profile's state and the profiles meta;
  // these actions only handle what it can't infer (key removal on delete).

  createProfile: (name: string) => {
    const s = get();
    const id = crypto.randomUUID();
    set({ profiles: [...s.profiles, { id, name }], activeProfileId: id, ...freshProfile() });
  },

  switchProfile: (newProfileId: string) => {
    const s = get();
    if (s.activeProfileId === newProfileId) return;
    set({ activeProfileId: newProfileId, ...hydrateProfile(loadProfileState(newProfileId)) });
  },

  renameProfile: (id: string, name: string) => {
    const s = get();
    set({ profiles: s.profiles.map(p => p.id === id ? { ...p, name } : p) });
  },

  deleteProfile: (id: string) => {
    const s = get();
    if (s.profiles.length <= 1) return;
    ls(() => localStorage.removeItem(profileKey(id)), undefined);
    const profiles = s.profiles.filter(p => p.id !== id);

    if (s.activeProfileId === id) {
      const newActiveId = profiles[0].id;
      set({ profiles, activeProfileId: newActiveId, ...hydrateProfile(loadProfileState(newActiveId)) });
    } else {
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

// ---------------------------------------------------------------------------
// Persistence boundary — the single writer (see note above the store).
// Synchronous: writes whichever bucket changed by reference. The remote-sync
// layer (Fase 2) will debounce on top of this same subscription.
// ---------------------------------------------------------------------------

useAppStore.subscribe((state, prev) => {
  if (state.profiles !== prev.profiles || state.activeProfileId !== prev.activeProfileId) {
    saveProfilesMeta({ profiles: state.profiles, activeProfileId: state.activeProfileId });
  }
  if (state.sharedCustomLists !== prev.sharedCustomLists) {
    saveSharedLists(state.sharedCustomLists);
  }
  const profileStateChanged =
    state.hideoutLevels !== prev.hideoutLevels ||
    state.targetLevels !== prev.targetLevels ||
    state.activeModules !== prev.activeModules ||
    state.inventory !== prev.inventory ||
    state.filterHideCompleted !== prev.filterHideCompleted ||
    state.listOrder !== prev.listOrder ||
    state.customLists !== prev.customLists ||
    state.checkedActions !== prev.checkedActions;
  // On a profile switch the active id changes together with all the slice refs:
  // we write the (new) active profile's state to its own key, never the old one.
  if (profileStateChanged || state.activeProfileId !== prev.activeProfileId) {
    saveProfileState(state.activeProfileId, state);
  }
});
