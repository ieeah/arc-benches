import type { AppState, List, Profile } from '../types';
import {
  isObject, sanitizeBoolRecord, sanitizeNumberRecord, sanitizeStringArray, validateList, validateProfile,
} from '../lib/validate';

// Per-profile state: each profile has its own key in localStorage.
// Global (cross-profile) data uses separate keys.
export const PROFILES_KEY = 'arc-raiders-tracker-profiles';
export const SHARED_LISTS_KEY = 'arc-raiders-tracker-shared-lists';
const LEGACY_KEY = 'arc-raiders-tracker-storage'; // migrated from single-profile era
export const profileKey = (id: string) => `arc-raiders-tracker-${id}`;

/** The 9 keys persisted per profile. */
export type PersistedState = Pick<AppState,
  'hideoutLevels' | 'targetLevels' | 'activeModules' | 'inventory' |
  'filterHideCompleted' | 'listOrder' | 'customLists' | 'checkedActions' |
  'activePersonalityId'
>;

export interface ProfilesMeta { profiles: Profile[]; activeProfileId: string; }

// All localStorage access is wrapped in try/catch: the app may run where storage is blocked
// (iframe/preview) — it must never crash, at worst it doesn't persist.
function ls<T>(fn: () => T, fallback: T): T {
  try { return fn(); } catch { return fallback; }
}

export function loadProfilesMeta(): ProfilesMeta | null {
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

export function saveProfilesMeta(meta: ProfilesMeta) {
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
  if (typeof raw.activePersonalityId === 'string' || raw.activePersonalityId === null) {
    out.activePersonalityId = raw.activePersonalityId;
  }
  return out;
}

export function loadProfileState(profileId: string): Partial<PersistedState> {
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

export function saveProfileState(profileId: string, s: PersistedState) {
  const slice: PersistedState = {
    hideoutLevels: s.hideoutLevels,
    targetLevels: s.targetLevels,
    activeModules: s.activeModules,
    inventory: s.inventory,
    filterHideCompleted: s.filterHideCompleted,
    listOrder: s.listOrder,
    customLists: s.customLists,
    checkedActions: s.checkedActions,
    activePersonalityId: s.activePersonalityId ?? null,
  };
  ls(() => localStorage.setItem(profileKey(profileId), JSON.stringify(slice)), undefined);
}

export function loadSharedLists(): List[] {
  return ls(() => {
    const parsed: unknown = JSON.parse(localStorage.getItem(SHARED_LISTS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.map(validateList).filter((l): l is List => l !== null) : [];
  }, []);
}

export function saveSharedLists(lists: List[]) {
  ls(() => localStorage.setItem(SHARED_LISTS_KEY, JSON.stringify(lists)), undefined);
}

export function removeProfileKey(id: string) {
  ls(() => localStorage.removeItem(profileKey(id)), undefined);
}

/** Resolve the saved profiles, or seed the default single profile on first run. */
export function initProfilesMeta(): ProfilesMeta {
  const saved = loadProfilesMeta();
  if (saved) return saved;
  const meta: ProfilesMeta = {
    profiles: [{ id: 'default', name: 'Principale' }],
    activeProfileId: 'default',
  };
  saveProfilesMeta(meta);
  return meta;
}
