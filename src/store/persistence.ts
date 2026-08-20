import type { AppState, List, Profile } from '../types';
import { safeLS } from '../lib/safeStorage';
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

export function loadProfilesMeta(): ProfilesMeta | null {
  return safeLS(() => {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed) || !Array.isArray(parsed.profiles)) return null;
    const profiles = parsed.profiles.map(validateProfile).filter((p): p is Profile => p !== null);
    if (profiles.length === 0) return null;

    // Preferenza profilo di avvio (startup-profile-option)
    const startupOption = localStorage.getItem('startup-profile-option') || 'last-used';
    const mainProfileId = localStorage.getItem('main-profile-id');

    let activeProfileId = profiles[0].id;
    if (startupOption === 'main' && mainProfileId && profiles.some(p => p.id === mainProfileId)) {
      activeProfileId = mainProfileId;
    } else if (startupOption !== 'last-used' && profiles.some(p => p.id === startupOption)) {
      activeProfileId = startupOption;
    } else if (typeof parsed.activeProfileId === 'string' && profiles.some(p => p.id === parsed.activeProfileId)) {
      activeProfileId = parsed.activeProfileId;
    }

    return { profiles, activeProfileId };
  }, null);
}

export function saveProfilesMeta(meta: ProfilesMeta) {
  safeLS(() => localStorage.setItem(PROFILES_KEY, JSON.stringify(meta)), undefined);
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
  return safeLS(() => {
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
  safeLS(() => localStorage.setItem(profileKey(profileId), JSON.stringify(slice)), undefined);
}

export function loadSharedLists(): List[] {
  return safeLS(() => {
    const parsed: unknown = JSON.parse(localStorage.getItem(SHARED_LISTS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.map(validateList).filter((l): l is List => l !== null) : [];
  }, []);
}

export function saveSharedLists(lists: List[]) {
  safeLS(() => localStorage.setItem(SHARED_LISTS_KEY, JSON.stringify(lists)), undefined);
}

export function removeProfileKey(id: string) {
  safeLS(() => localStorage.removeItem(profileKey(id)), undefined);
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

export const SETTINGS_KEY = 'arc-raiders-tracker-settings';

export interface AppSettingsData {
  navSide: 'left' | 'right';
  radialMenuEnabled: boolean;
  quickFavorites: [string, string];
  mainProfileId: string;
  startupProfileOption: string;
}

export function loadSettings(): AppSettingsData {
  return safeLS(() => {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const legacyNav = localStorage.getItem('nav-side') as 'left' | 'right' | null;
    const legacyRadial = localStorage.getItem('radial-menu-enabled');
    const legacyMain = localStorage.getItem('main-profile-id');
    const legacyStartup = localStorage.getItem('startup-profile-option');

    let parsed: Partial<AppSettingsData> = {};
    if (raw) {
      try { parsed = JSON.parse(raw); } catch {}
    }

    const defaultFavorites: [string, string] = ['stash', 'liste'];
    const favorites: [string, string] = (Array.isArray(parsed.quickFavorites) && parsed.quickFavorites.length === 2 && typeof parsed.quickFavorites[0] === 'string' && typeof parsed.quickFavorites[1] === 'string')
      ? [parsed.quickFavorites[0], parsed.quickFavorites[1]]
      : defaultFavorites;

    return {
      navSide: (parsed.navSide === 'left' || parsed.navSide === 'right') ? parsed.navSide : (legacyNav === 'left' || legacyNav === 'right' ? legacyNav : 'right'),
      radialMenuEnabled: typeof parsed.radialMenuEnabled === 'boolean' ? parsed.radialMenuEnabled : (legacyRadial !== null ? legacyRadial !== 'false' : true),
      quickFavorites: favorites,
      mainProfileId: typeof parsed.mainProfileId === 'string' ? parsed.mainProfileId : (legacyMain || 'default'),
      startupProfileOption: typeof parsed.startupProfileOption === 'string' ? parsed.startupProfileOption : (legacyStartup || 'last-used'),
    };
  }, {
    navSide: 'right',
    radialMenuEnabled: true,
    quickFavorites: ['stash', 'liste'],
    mainProfileId: 'default',
    startupProfileOption: 'last-used',
  });
}

export function saveSettings(settings: AppSettingsData) {
  safeLS(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem('nav-side', settings.navSide);
    localStorage.setItem('radial-menu-enabled', String(settings.radialMenuEnabled));
    localStorage.setItem('main-profile-id', settings.mainProfileId);
    localStorage.setItem('startup-profile-option', settings.startupProfileOption);
  }, undefined);
}
