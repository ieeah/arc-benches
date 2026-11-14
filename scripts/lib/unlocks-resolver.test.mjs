import { describe, it, expect } from 'vitest';
import { resolveUnlocksItemId } from './unlocks-resolver.mjs';

describe('unlocks-resolver', () => {
  const mockItems = {
    'advanced-camera': {
      id: 'advanced-camera',
      name: 'Advanced Camera',
      item_type: 'Quick Use',
    },
    'advanced-camera-blueprint': {
      id: 'advanced-camera-blueprint',
      name: 'Advanced Camera Blueprint',
      item_type: 'Blueprint',
    },
    'anvil-i': {
      id: 'anvil-i',
      name: 'Anvil I',
      item_type: 'Weapon',
    },
    'anvil-recipe': {
      id: 'anvil-recipe',
      name: 'Anvil Blueprint',
      item_type: 'Blueprint',
    },
    'alpine-wardrobe': {
      id: 'alpine-wardrobe',
      name: 'Alpine Wardrobe',
      item_type: 'Furniture',
    },
    'alpine-wardrobe-design': {
      id: 'alpine-wardrobe-design',
      name: 'Alpine Wardrobe Design',
      item_type: 'Design',
    },
    'combat-mk-3-aggressive': {
      id: 'combat-mk-3-aggressive',
      name: 'Combat Mk. 3 (Aggressive)',
      item_type: 'Augment',
    },
    'combat-mk-3-flanking': {
      id: 'combat-mk-3-flanking',
      name: 'Combat Mk. 3 (Flanking) Blueprint',
      item_type: 'Blueprint',
    },
    'regular-iron': {
      id: 'regular-iron',
      name: 'Regular Iron',
      item_type: 'Basic Material',
    },
  };

  const mockBaseItems = {
    anvil: {
      id: 'anvil',
      blueprintItemId: 'anvil-recipe',
      variantItemIds: ['anvil-i', 'anvil-ii'],
    },
  };

  it('resolves blueprint via base items mapping', () => {
    const bp = mockItems['anvil-recipe'];
    expect(resolveUnlocksItemId(bp, mockItems, mockBaseItems)).toBe('anvil-i');
  });

  it('resolves blueprint by ID stripping suffix', () => {
    const bp = mockItems['advanced-camera-blueprint'];
    expect(resolveUnlocksItemId(bp, mockItems, mockBaseItems)).toBe('advanced-camera');
  });

  it('resolves design to corresponding furniture by ID stripping -design', () => {
    const design = mockItems['alpine-wardrobe-design'];
    expect(resolveUnlocksItemId(design, mockItems, mockBaseItems)).toBe('alpine-wardrobe');
  });

  it('resolves special cases like combat-mk-3-flanking augment', () => {
    const bp = mockItems['combat-mk-3-flanking'];
    expect(resolveUnlocksItemId(bp, mockItems, mockBaseItems)).toBe('combat-mk-3-aggressive');
  });

  it('returns null for items that do not unlock anything', () => {
    const material = mockItems['regular-iron'];
    expect(resolveUnlocksItemId(material, mockItems, mockBaseItems)).toBeNull();
  });
});
