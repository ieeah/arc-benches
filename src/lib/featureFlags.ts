import { useSyncExternalStore } from 'react';
import { safeLS } from '@/lib/safeStorage';
import defaultFeatureFlagsSeed from '@/data/feature-flags.json';

export type FeatureFlagId = 'expeditions' | 'vault' | 'role-maker' | 'blueprints';

export interface FeatureFlagDefinition {
  id: FeatureFlagId;
  name: string;
  description: string;
  category: 'core' | 'tools';
  defaultValue: boolean;
  navIds: string[];
  routes: string[];
}

const SEED_FLAGS = defaultFeatureFlagsSeed as Record<FeatureFlagId, boolean>;

export const FEATURE_FLAGS_DEFINITIONS: readonly FeatureFlagDefinition[] = [
  {
    id: 'expeditions',
    name: 'Spedizioni',
    description: 'Modulo di tracciamento carovane, carichi, donazioni e reset prestigio',
    category: 'core',
    defaultValue: SEED_FLAGS.expeditions ?? true,
    navIds: ['expeditions'],
    routes: ['expeditions'],
  },
  {
    id: 'vault',
    name: 'Vault Spedizione',
    description: 'Voce e strumenti di deposito vault per le spedizioni nel menu strumenti',
    category: 'tools',
    defaultValue: SEED_FLAGS.vault ?? true,
    navIds: ['vault'],
    routes: ['vault'],
  },
  {
    id: 'role-maker',
    name: 'Role Maker',
    description: 'Generatore casuale di ruoli, archetipi e build comportamentali 🎲',
    category: 'tools',
    defaultValue: SEED_FLAGS['role-maker'] ?? true,
    navIds: ['role-maker'],
    routes: ['role-maker'],
  },
  {
    id: 'blueprints',
    name: 'Tracker Blueprints',
    description: 'Registro e tracciamento progetti/blueprint del rifugio',
    category: 'core',
    defaultValue: SEED_FLAGS.blueprints ?? true,
    navIds: ['blueprints'],
    routes: ['blueprints'],
  },
] as const;

const STORAGE_KEY = 'arc_benches_feature_flags_v1';

export type FeatureFlagsState = Record<FeatureFlagId, boolean>;

export function getDefaultFeatureFlags(): FeatureFlagsState {
  const defaults = {} as FeatureFlagsState;
  for (const def of FEATURE_FLAGS_DEFINITIONS) {
    defaults[def.id] = def.defaultValue;
  }
  return { ...defaults, ...SEED_FLAGS };
}

let memoryState: FeatureFlagsState | null = null;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach(fn => {
    try {
      fn();
    } catch {
      // ignore listener error
    }
  });
}

/** Reads the current feature flags from localStorage or memory fallback or defaults. */
export function getFeatureFlags(): FeatureFlagsState {
  const defaults = getDefaultFeatureFlags();
  if (typeof window === 'undefined' && memoryState) {
    return { ...defaults, ...memoryState };
  }
  try {
    const raw = safeLS(() => localStorage.getItem(STORAGE_KEY), null);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...defaults, ...parsed };
      }
    }
  } catch {
    // ignore parse errors
  }
  if (memoryState) {
    return { ...defaults, ...memoryState };
  }
  return defaults;
}

/** Checks whether a specific feature flag is currently active. */
export function isFeatureEnabled(id: FeatureFlagId): boolean {
  const flags = getFeatureFlags();
  return flags[id] ?? true;
}

/** Sets the enabled state for a specific feature flag. */
export function setFeatureFlag(id: FeatureFlagId, enabled: boolean): void {
  const current = getFeatureFlags();
  const next = { ...current, [id]: enabled };
  memoryState = next;
  safeLS(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(next)), undefined);
  notifyListeners();
}

/** Sets all feature flags to either all enabled or all disabled. */
export function setAllFeatureFlags(enabled: boolean): void {
  const next = {} as FeatureFlagsState;
  for (const def of FEATURE_FLAGS_DEFINITIONS) {
    next[def.id] = enabled;
  }
  memoryState = next;
  safeLS(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(next)), undefined);
  notifyListeners();
}

/** Resets all feature flags to their factory default values. */
export function resetFeatureFlags(): void {
  memoryState = null;
  safeLS(() => localStorage.removeItem(STORAGE_KEY), undefined);
  notifyListeners();
}

/** Checks whether any feature flag differs from its default value. */
export function hasCustomFeatureFlags(): boolean {
  const current = getFeatureFlags();
  const defaults = getDefaultFeatureFlags();
  for (const key of Object.keys(defaults) as FeatureFlagId[]) {
    if (current[key] !== defaults[key]) return true;
  }
  return false;
}

/** Checks whether a navigation item ID is allowed under the current feature flags. */
export function isNavIdEnabled(navId: string): boolean {
  for (const def of FEATURE_FLAGS_DEFINITIONS) {
    if (def.navIds.includes(navId)) {
      return isFeatureEnabled(def.id);
    }
  }
  return true;
}

/** Checks whether a route is allowed under the current feature flags. */
export function isRouteEnabled(route: string): boolean {
  for (const def of FEATURE_FLAGS_DEFINITIONS) {
    if (def.routes.includes(route)) {
      return isFeatureEnabled(def.id);
    }
  }
  return true;
}

/** Subscribes to feature flag mutations. */
export function subscribeFeatureFlags(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let cachedSnapshot: FeatureFlagsState = getFeatureFlags();
let cachedSnapshotStr = JSON.stringify(cachedSnapshot);

function getSnapshot(): FeatureFlagsState {
  const current = getFeatureFlags();
  const currentStr = JSON.stringify(current);
  if (currentStr !== cachedSnapshotStr) {
    cachedSnapshot = current;
    cachedSnapshotStr = currentStr;
  }
  return cachedSnapshot;
}

/** React hook for reactive feature flag state. */
export function useFeatureFlags() {
  const flags = useSyncExternalStore(subscribeFeatureFlags, getSnapshot, getDefaultFeatureFlags);

  return {
    flags,
    isEnabled: (id: FeatureFlagId) => flags[id] ?? true,
    setFlag: setFeatureFlag,
    setAll: setAllFeatureFlags,
    reset: resetFeatureFlags,
    isDirty: hasCustomFeatureFlags(),
  };
}
