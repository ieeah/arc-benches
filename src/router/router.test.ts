import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseHash, buildHash, VALID_ROUTES } from './index';
import { setFeatureFlag, resetFeatureFlags } from '@/lib/featureFlags';

// Il seed reale (src/data/feature-flags.json) cambia con le release: i test non devono dipenderne.
vi.mock('@/data/feature-flags.json', () => ({
  default: { expeditions: true, vault: true, 'role-maker': true, blueprints: true, maps: true, 'reward-pass': true },
}));

describe('Router hash parsing & building', () => {
  beforeEach(() => {
    resetFeatureFlags();
  });

  it('parses simple hash routes correctly', () => {
    expect(parseHash('#stash')).toEqual({ route: 'stash', params: {} });
    expect(parseHash('#/stash')).toEqual({ route: 'stash', params: {} });
    expect(parseHash('#/liste')).toEqual({ route: 'liste', params: {} });
    expect(parseHash('#/blueprints')).toEqual({ route: 'blueprints', params: {} });
    expect(parseHash('#/expeditions')).toEqual({ route: 'expeditions', params: {} });
    expect(parseHash('#/items')).toEqual({ route: 'items', params: {} });
    expect(parseHash('#/maps')).toEqual({ route: 'maps', params: {} });
    expect(parseHash('#/settings')).toEqual({ route: 'settings', params: {} });
    expect(parseHash('#/dev-flags')).toEqual({ route: 'dev-flags', params: {} });
  });

  it('redirects to stash when a feature flag is disabled', () => {
    setFeatureFlag('blueprints', false);
    expect(parseHash('#/blueprints')).toEqual({ route: 'stash', params: {} });

    setFeatureFlag('expeditions', false);
    expect(parseHash('#/expeditions')).toEqual({ route: 'stash', params: {} });

    setFeatureFlag('role-maker', false);
    expect(parseHash('#/role-maker')).toEqual({ route: 'stash', params: {} });

    // Stash and settings remain accessible
    expect(parseHash('#/stash')).toEqual({ route: 'stash', params: {} });
    expect(parseHash('#/settings')).toEqual({ route: 'settings', params: {} });
  });

  it('parses hash routes with query parameters', () => {
    const detailLoc = parseHash('#/list-detail?id=workbench-weapons');
    expect(detailLoc.route).toBe('list-detail');
    expect(detailLoc.params).toEqual({ id: 'workbench-weapons' });

    const overrideLoc = parseHash('#/dev-overrides?item=metal-parts');
    expect(overrideLoc.route).toBe('dev-overrides');
    expect(overrideLoc.params).toEqual({ item: 'metal-parts' });
  });

  it('falls back to stash for empty or invalid routes', () => {
    expect(parseHash('')).toEqual({ route: 'stash', params: {} });
    expect(parseHash('#')).toEqual({ route: 'stash', params: {} });
    expect(parseHash('#/')).toEqual({ route: 'stash', params: {} });
    expect(parseHash('#/invalid-page-does-not-exist')).toEqual({ route: 'stash', params: {} });
  });

  it('builds hash correctly from route and parameters', () => {
    expect(buildHash('stash')).toBe('#/stash');
    expect(buildHash('expeditions')).toBe('#/expeditions');
    expect(buildHash('list-detail', { id: 'workbench-gear' })).toBe('#/list-detail?id=workbench-gear');
    expect(buildHash('dev-overrides', { item: 'seeds' })).toBe('#/dev-overrides?item=seeds');
    expect(buildHash('dev-flags')).toBe('#/dev-flags');
  });

  it('supports all valid routes when flags are active', () => {
    VALID_ROUTES.forEach((r) => {
      const loc = parseHash(`#/${r}`);
      expect(loc.route).toBe(r);
    });
  });
});
