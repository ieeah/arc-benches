import type { ItemInfo, List } from '../types';
import workbenchesData from '../data/workbenches.json';
import itemsData from '../data/items.json';
import type { PersistedState } from './persistence';

// The Refiner bench gates item crafting (see refinerCraftLevel + the craftable-now badges).
export const REFINER_ID = 'refiner';

export const workbenches = (workbenchesData.items as List[]).filter(w => w.maxLevel > 0);
export const itemsInfo = itemsData as Record<string, ItemInfo>;

export const levelsAbove = (current: number, max: number): number[] => {
  const r: number[] = [];
  for (let l = current + 1; l <= max; l++) r.push(l);
  return r;
};

export const migrateTargets = (
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
export const defaultHideoutLevels: Record<string, number> = {};
export const defaultTargetLevels: Record<string, number[]> = {};
export const defaultActiveModules: Record<string, boolean> = {};
workbenches.forEach(w => {
  const cur = w.id === 'scrappy' ? 1 : 0;
  defaultHideoutLevels[w.id] = cur;
  defaultTargetLevels[w.id] = levelsAbove(cur, w.maxLevel);
  defaultActiveModules[w.id] = true;
});

/** Build the full in-memory state for a profile from its (partial) persisted slice. */
export const hydrateProfile = (loaded: Partial<PersistedState>): PersistedState => ({
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
  activePersonalityId: loaded.activePersonalityId ?? null,
});

/** Fresh (empty) progress for a brand-new profile. */
export const freshProfile = (): PersistedState => ({
  hideoutLevels: { ...defaultHideoutLevels },
  targetLevels: { ...defaultTargetLevels },
  activeModules: { ...defaultActiveModules },
  inventory: {},
  filterHideCompleted: true,
  listOrder: workbenches.map(w => w.id),
  customLists: [],
  checkedActions: {},
  activePersonalityId: null,
});
