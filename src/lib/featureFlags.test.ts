import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDefaultFeatureFlags,
  getFeatureFlags,
  setFeatureFlag,
  setAllFeatureFlags,
  resetFeatureFlags,
  isFeatureEnabled,
  isNavIdEnabled,
  isRouteEnabled,
  hasCustomFeatureFlags,
  subscribeFeatureFlags,
} from './featureFlags';

// Il seed reale (src/data/feature-flags.json) cambia con le release: i test non devono dipenderne.
vi.mock('@/data/feature-flags.json', () => ({
  default: { expeditions: true, vault: true, 'role-maker': true, blueprints: true, maps: true },
}));

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

const mockLocalStorage = new MockStorage();
vi.stubGlobal('localStorage', mockLocalStorage);

describe('featureFlags module', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    resetFeatureFlags();
  });

  it('provides the seed values as defaults', () => {
    const defaults = getDefaultFeatureFlags();
    expect(defaults.expeditions).toBe(true);
    expect(defaults.vault).toBe(true);
    expect(defaults['role-maker']).toBe(true);
    expect(defaults.blueprints).toBe(true);
    expect(getFeatureFlags()).toEqual(defaults);
    expect(hasCustomFeatureFlags()).toBe(false);
  });

  it('allows toggling a feature flag and saves to localStorage', () => {
    setFeatureFlag('expeditions', false);
    expect(isFeatureEnabled('expeditions')).toBe(false);
    expect(isFeatureEnabled('blueprints')).toBe(true);
    expect(hasCustomFeatureFlags()).toBe(true);

    const saved = JSON.parse(localStorage.getItem('arc_benches_feature_flags_v1') || '{}');
    expect(saved.expeditions).toBe(false);
  });

  it('correctly maps navId and route checks', () => {
    expect(isNavIdEnabled('expeditions')).toBe(true);
    expect(isRouteEnabled('expeditions')).toBe(true);
    expect(isNavIdEnabled('vault')).toBe(true);
    expect(isNavIdEnabled('role-maker')).toBe(true);
    expect(isRouteEnabled('role-maker')).toBe(true);
    expect(isNavIdEnabled('blueprints')).toBe(true);
    expect(isRouteEnabled('blueprints')).toBe(true);

    // Unknown navId / route should be allowed by default
    expect(isNavIdEnabled('stash')).toBe(true);
    expect(isRouteEnabled('stash')).toBe(true);

    // Disable blueprints
    setFeatureFlag('blueprints', false);
    expect(isNavIdEnabled('blueprints')).toBe(false);
    expect(isRouteEnabled('blueprints')).toBe(false);
    // Other features remain enabled
    expect(isNavIdEnabled('expeditions')).toBe(true);
  });

  it('can set all flags or reset to defaults', () => {
    setAllFeatureFlags(false);
    expect(isFeatureEnabled('expeditions')).toBe(false);
    expect(isFeatureEnabled('vault')).toBe(false);
    expect(isFeatureEnabled('role-maker')).toBe(false);
    expect(isFeatureEnabled('blueprints')).toBe(false);
    expect(hasCustomFeatureFlags()).toBe(true);

    resetFeatureFlags();
    expect(isFeatureEnabled('expeditions')).toBe(true);
    expect(isFeatureEnabled('vault')).toBe(true);
    expect(isFeatureEnabled('role-maker')).toBe(true);
    expect(isFeatureEnabled('blueprints')).toBe(true);
    expect(hasCustomFeatureFlags()).toBe(false);
  });

  it('notifies subscribers on change', () => {
    let callCount = 0;
    const unsub = subscribeFeatureFlags(() => {
      callCount++;
    });

    setFeatureFlag('vault', false);
    expect(callCount).toBe(1);

    resetFeatureFlags();
    expect(callCount).toBe(2);

    unsub();
    setFeatureFlag('vault', true);
    expect(callCount).toBe(2);
  });
});
