import { describe, it, expect } from 'vitest';
import { getCategoryIconPath } from './categoryIcons';

describe('categoryIcons', () => {
  it('returns null for empty or null itemType', () => {
    expect(getCategoryIconPath(null)).toBeNull();
    expect(getCategoryIconPath(undefined)).toBeNull();
    expect(getCategoryIconPath('')).toBeNull();
  });

  it('maps material item types to material.webp', () => {
    expect(getCategoryIconPath('Basic Material')).toContain('material.webp');
    expect(getCategoryIconPath('Advanced Material')).toContain('material.webp');
    expect(getCategoryIconPath('Refined Material')).toContain('material.webp');
    expect(getCategoryIconPath('Topside Material')).toContain('material.webp');
    expect(getCategoryIconPath('Recyclable')).toContain('material.webp');
  });

  it('maps weapons and mods to their respective icons', () => {
    expect(getCategoryIconPath('Weapon')).toContain('weapon.webp');
    expect(getCategoryIconPath('Modification')).toContain('weapon-mod.webp');
  });

  it('maps medical, quick use and consumables to regenerative.webp', () => {
    expect(getCategoryIconPath('Quick Use')).toContain('regenerative.webp');
    expect(getCategoryIconPath('Consumable')).toContain('regenerative.webp');
  });

  it('maps keys, blueprints, shields, augments, trinkets, gadgets and throwables', () => {
    expect(getCategoryIconPath('Key')).toContain('key.webp');
    expect(getCategoryIconPath('Blueprint')).toContain('blueprint.webp');
    expect(getCategoryIconPath('Shield')).toContain('shield.webp');
    expect(getCategoryIconPath('Augment')).toContain('augment.webp');
    expect(getCategoryIconPath('Trinket')).toContain('trinket.webp');
    expect(getCategoryIconPath('Gadget')).toContain('gadget.webp');
    expect(getCategoryIconPath('Throwable')).toContain('grenade.webp');
  });

  it('falls back to misc.webp for other types', () => {
    expect(getCategoryIconPath('Cosmetic')).toContain('misc.webp');
    expect(getCategoryIconPath('Quest Item')).toContain('misc.webp');
    expect(getCategoryIconPath('Misc')).toContain('misc.webp');
    expect(getCategoryIconPath('Unknown Type X')).toContain('misc.webp');
  });
});
