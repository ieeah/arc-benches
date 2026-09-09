import { describe, it, expect } from 'vitest';
import { parseHash, buildHash, VALID_ROUTES } from './index';

describe('Router hash parsing & building', () => {
  it('parses simple hash routes correctly', () => {
    expect(parseHash('#stash')).toEqual({ route: 'stash', params: {} });
    expect(parseHash('#/stash')).toEqual({ route: 'stash', params: {} });
    expect(parseHash('#/liste')).toEqual({ route: 'liste', params: {} });
    expect(parseHash('#/blueprints')).toEqual({ route: 'blueprints', params: {} });
    expect(parseHash('#/expeditions')).toEqual({ route: 'expeditions', params: {} });
    expect(parseHash('#/items')).toEqual({ route: 'items', params: {} });
    expect(parseHash('#/maps')).toEqual({ route: 'maps', params: {} });
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
  });

  it('supports all valid routes', () => {
    VALID_ROUTES.forEach((r) => {
      const loc = parseHash(`#/${r}`);
      expect(loc.route).toBe(r);
    });
  });
});
