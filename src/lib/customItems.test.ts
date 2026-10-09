import { describe, it, expect } from 'vitest';
import {
  emptyCustomItem,
  isMetaForgeCollision,
  isValidItemId,
  serializeCustomItems,
  validateCustomItem,
  type CustomItemDef,
} from './customItems';

const valid = (patch: Partial<CustomItemDef> = {}): CustomItemDef => ({
  ...emptyCustomItem('new-thing'),
  name: 'New Thing',
  item_type: 'Currency',
  translations: { it: { name: 'Nuova cosa', description: '' } },
  ...patch,
});

const catalog = new Set(['metal-parts', 'reward-points']);
const baseline = new Set(['reward-points']);

describe('isValidItemId', () => {
  it('accepts hyphen-case only', () => {
    expect(isValidItemId('metal-parts')).toBe(true);
    expect(isValidItemId('xp-points')).toBe(true);
    for (const bad of ['Metal-Parts', 'metal_parts', '-a', 'a-', 'a--b', '', 'a b']) expect(isValidItemId(bad)).toBe(false);
  });
});

describe('validateCustomItem', () => {
  it('passes a complete item with no issues', () => {
    expect(validateCustomItem(valid(), catalog, baseline)).toEqual({ errors: [], warnings: [] });
  });

  it('reports missing required fields and bad numbers', () => {
    const { errors } = validateCustomItem(valid({ name: ' ', item_type: '', value: -1, stack_size: 0 }), catalog, baseline);
    expect(errors).toHaveLength(4);
  });

  it('warns when the id collides with a MetaForge item, but not with an existing custom one', () => {
    expect(validateCustomItem(valid({ id: 'metal-parts' }), catalog, baseline).warnings.join(' ')).toMatch(/MetaForge/);
    expect(validateCustomItem(valid({ id: 'reward-points' }), catalog, baseline).warnings).toEqual([]);
  });

  it('warns about a missing Italian name', () => {
    expect(validateCustomItem(valid({ translations: undefined }), catalog, baseline).warnings).toHaveLength(1);
  });
});

describe('isMetaForgeCollision', () => {
  it('flags ids in the catalog that are not custom items', () => {
    expect(isMetaForgeCollision('metal-parts', catalog, baseline)).toBe(true);
    expect(isMetaForgeCollision('reward-points', catalog, baseline)).toBe(false);
    expect(isMetaForgeCollision('brand-new', catalog, baseline)).toBe(false);
  });
});

describe('serializeCustomItems', () => {
  it('trims text, drops empty translations and keeps a stable field order', () => {
    const out = serializeCustomItems({
      'new-thing': valid({ name: '  New Thing ', translations: { it: { name: ' ', description: '' } } }),
    });
    expect(out['new-thing'].name).toBe('New Thing');
    expect('translations' in out['new-thing']).toBe(false);
    expect(Object.keys(out['new-thing']).slice(0, 4)).toEqual(['id', 'name', 'description', 'icon']);
  });
});
