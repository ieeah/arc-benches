import { describe, it, expect } from 'vitest';
import { getOutfitPart } from './outfitParts';

describe('getOutfitPart', () => {
  it('recognizes the base set, the toggles and the colors from the subcategory', () => {
    expect(getOutfitPart({ item_type: 'Outfits', subcategory: 'Outfit' })).toBe('set');
    expect(getOutfitPart({ item_type: 'Cosmetic', subcategory: 'Outfit Variant' })).toBe('toggle');
    expect(getOutfitPart({ item_type: 'Cosmetic', subcategory: 'Outfit Color' })).toBe('color');
  });

  it('treats an Outfits item without subcategory as a base set', () => {
    expect(getOutfitPart({ item_type: 'Outfits', subcategory: null })).toBe('set');
  });

  it('ignores case and spaces', () => {
    expect(getOutfitPart({ item_type: 'cosmetic', subcategory: ' outfit color ' })).toBe('color');
  });

  it('returns null for other cosmetics and for unknown items', () => {
    expect(getOutfitPart({ item_type: 'Cosmetic', subcategory: 'Emote' })).toBeNull();
    expect(getOutfitPart({ item_type: 'Cosmetic', subcategory: 'Backpack Color' })).toBeNull();
    expect(getOutfitPart({ item_type: 'Material', subcategory: null })).toBeNull();
    expect(getOutfitPart(undefined)).toBeNull();
  });
});
