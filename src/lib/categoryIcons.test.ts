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

  it('prioritizes the curated subcategory over the unreliable MetaForge item_type for the Quick Use domain', () => {
    // MetaForge scrapes Healing/Utility/Gadget/Grenade/Trap items almost entirely as
    // item_type "Quick Use" — the real distinction survives only in the curated
    // subcategory overrides (items-overrides.json), which must win over item_type here.
    expect(getCategoryIconPath('Quick Use', 'Healing')).toContain('regenerative.webp');
    expect(getCategoryIconPath('Quick Use', 'Utility')).toContain('utility.webp');
    expect(getCategoryIconPath('Quick Use', 'Gadget')).toContain('gadget.webp');
    expect(getCategoryIconPath('Quick Use', 'Grenade')).toContain('grenade.webp');
    expect(getCategoryIconPath('Quick Use', 'Trap')).toContain('trap.webp');
    // Also overrides a wrong/misleading item_type entirely, not just the generic "Quick Use" one
    expect(getCategoryIconPath('Trinket', 'Key')).toContain('key.webp');
    expect(getCategoryIconPath('Quest Item', 'Key')).toContain('key.webp');
  });

  it('is case-insensitive and trims whitespace on subcategory', () => {
    expect(getCategoryIconPath('Quick Use', '  grenade  ')).toContain('grenade.webp');
    expect(getCategoryIconPath('Quick Use', 'GRENADE')).toContain('grenade.webp');
  });

  it('falls back to the item_type resolution when subcategory is not one of the curated values', () => {
    expect(getCategoryIconPath('Weapon', 'Assault Rifle')).toContain('weapon.webp');
    expect(getCategoryIconPath('Basic Material', 'Basic Material')).toContain('material.webp');
    expect(getCategoryIconPath('Weapon', null)).toContain('weapon.webp');
  });
});
