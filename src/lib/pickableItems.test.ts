import { describe, it, expect } from 'vitest';
import type { ItemInfo } from '@/types';
import {
  isPickableItem,
  getItemPoolTier,
  rankItemsByRelevance,
  MAX_VISIBLE_RESULTS,
} from './pickableItems';

const mockItem = (patch: Partial<ItemInfo>): ItemInfo => ({
  id: 'x',
  name: 'X',
  description: '',
  icon: null,
  rarity: 'Common',
  item_type: 'Basic Material',
  subcategory: null,
  value: null,
  workbench: null,
  loot_area: null,
  stack_size: null,
  ...patch,
});

describe('getItemPoolTier', () => {
  it('correctly classifies items into Pool 1, Pool 2, and Pool 3 for raid context', () => {
    // Pool 1: Materiali, Consumabili, Modifiche, Scudi, Munizioni, Chiavi, Trinket
    expect(getItemPoolTier(mockItem({ item_type: 'Basic Material' }), 'raid')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Quick Use' }), 'raid')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Modification' }), 'raid')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Shield' }), 'raid')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Ammunition' }), 'raid')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Trinket' }), 'raid')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Key' }), 'raid')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Quest Item' }), 'raid')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Research Item' }), 'raid')).toBe(1);

    // Pool 2: Blueprint, Stencil, Design, Weapon, Augment
    expect(getItemPoolTier(mockItem({ item_type: 'Blueprint' }), 'raid')).toBe(2);
    expect(getItemPoolTier(mockItem({ item_type: 'Stencil' }), 'raid')).toBe(2);
    expect(getItemPoolTier(mockItem({ item_type: 'Design' }), 'raid')).toBe(2);
    expect(getItemPoolTier(mockItem({ item_type: 'Weapon' }), 'raid')).toBe(2);
    expect(getItemPoolTier(mockItem({ item_type: 'Augment' }), 'raid')).toBe(2);

    // Pool 3 (Escluso): Cosmetic, Outfits, Furniture, Currency, Research, Misc
    expect(getItemPoolTier(mockItem({ item_type: 'Cosmetic' }), 'raid')).toBeNull();
    expect(getItemPoolTier(mockItem({ item_type: 'Outfits' }), 'raid')).toBeNull();
    expect(getItemPoolTier(mockItem({ item_type: 'Furniture' }), 'raid')).toBeNull();
    expect(getItemPoolTier(mockItem({ item_type: 'Currency' }), 'raid')).toBeNull();
    expect(getItemPoolTier(mockItem({ item_type: 'Research' }), 'raid')).toBeNull();
    expect(getItemPoolTier(mockItem({ item_type: 'Misc' }), 'raid')).toBeNull();
  });

  it('correctly classifies items for custom_list context', () => {
    expect(getItemPoolTier(mockItem({ item_type: 'Basic Material' }), 'custom_list')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Blueprint' }), 'custom_list')).toBe(2);
    expect(getItemPoolTier(mockItem({ item_type: 'Cosmetic' }), 'custom_list')).toBeNull();
  });

  it('allows Currency in Pool 2 for dev_action and dev_list', () => {
    expect(getItemPoolTier(mockItem({ item_type: 'Currency' }), 'dev_action')).toBe(2);
    expect(getItemPoolTier(mockItem({ item_type: 'Currency' }), 'dev_list')).toBe(2);
  });

  it('correctly classifies items for reward context (everything except Misc is valid)', () => {
    // Pool 1: Cosmetici, Outfit, Blueprint, Armi, Valute...
    expect(getItemPoolTier(mockItem({ item_type: 'Cosmetic' }), 'reward')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Outfits' }), 'reward')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Blueprint' }), 'reward')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Weapon' }), 'reward')).toBe(1);
    expect(getItemPoolTier(mockItem({ item_type: 'Currency' }), 'reward')).toBe(1);

    // Pool 2: Materiali, Scudi, Munizioni, Design...
    expect(getItemPoolTier(mockItem({ item_type: 'Basic Material' }), 'reward')).toBe(2);
    expect(getItemPoolTier(mockItem({ item_type: 'Shield' }), 'reward')).toBe(2);
    expect(getItemPoolTier(mockItem({ item_type: 'Design' }), 'reward')).toBe(2);

    // Pool 3: Misc
    expect(getItemPoolTier(mockItem({ item_type: 'Misc' }), 'reward')).toBeNull();
  });

  it('always excludes hidden, deprecated and already chosen items', () => {
    expect(getItemPoolTier(mockItem({ hidden: true }), 'raid')).toBeNull();
    expect(getItemPoolTier(mockItem({ deprecated: true }), 'raid')).toBeNull();
    expect(getItemPoolTier(mockItem({ id: 'item-1' }), 'raid', new Set(['item-1']))).toBeNull();

    expect(getItemPoolTier(mockItem({ hidden: true }), 'reward')).toBeNull();
    expect(getItemPoolTier(mockItem({ deprecated: true }), 'reward')).toBeNull();
  });

  it('excludes variant items in non-reward contexts, but in reward context allows variants and excludes abstract base items', () => {
    // 'anvil-iv' è una variante registrata in item-variants.json
    const variantItem = mockItem({ id: 'anvil-iv', item_type: 'Weapon' });
    // 'anvil' è il Base Item che raggruppa le varianti
    const baseItem = mockItem({ id: 'anvil', item_type: 'Weapon' });

    expect(getItemPoolTier(variantItem, 'raid')).toBeNull();
    expect(getItemPoolTier(variantItem, 'custom_list')).toBeNull();
    expect(getItemPoolTier(variantItem, 'dev_action')).toBeNull();
    expect(getItemPoolTier(baseItem, 'raid')).toBe(2);

    // Nelle ricompense, le varianti d'arma specifiche (es. Anvil IV) sono ottenibili e selezionabili
    expect(getItemPoolTier(variantItem, 'reward')).toBe(1);
    // Ma il Base Item astratto/aggregatore ('anvil') non esiste come ricompensa in-game ed è quindi escluso
    expect(getItemPoolTier(baseItem, 'reward')).toBeNull();
  });
});

describe('isPickableItem', () => {
  it('accepts normal items for custom_list by default', () => {
    expect(isPickableItem(mockItem({ item_type: 'Basic Material' }))).toBe(true);
    expect(isPickableItem(mockItem({ item_type: 'Material' }))).toBe(true);
  });

  it('excludes non-gameplay types from standard lists', () => {
    for (const item_type of ['Cosmetic', 'Outfits', 'Furniture', 'Research', 'Currency']) {
      expect(isPickableItem(mockItem({ item_type }))).toBe(false);
    }
  });

  it('supports legacy includeAll and includeBlueprints options', () => {
    expect(isPickableItem(mockItem({ item_type: 'Cosmetic' }), { includeAll: true })).toBe(true);
    expect(isPickableItem(mockItem({ item_type: 'Blueprint' }), { includeBlueprints: true })).toBe(true);
    expect(isPickableItem(mockItem({ item_type: 'Cosmetic' }), { includeBlueprints: true })).toBe(false);
  });
});

describe('rankItemsByRelevance', () => {
  const itemA = mockItem({
    id: 'metal-parts',
    name: 'Metal Parts',
    item_type: 'Basic Material',
    translations: { it: { name: 'Parti Metalliche' } },
  });

  const itemB = mockItem({
    id: 'heavy-metal-decor',
    name: 'Heavy Metal Decor',
    item_type: 'Design',
    translations: { it: { name: 'Decorazione Metallo Pesante' } },
  });

  it('prioritizes Pool 1 items over Pool 2 items', () => {
    // In raid context:
    // itemA ('Basic Material') è Pool 1.
    // itemB ('Design') è Pool 2.
    // Entrambi contengono "metallo" / "metal".
    const results = rankItemsByRelevance([itemB, itemA], 'metal', 'raid', 'en');
    expect(results[0].id).toBe('metal-parts');
    expect(results[1].id).toBe('heavy-metal-decor');
  });

  it('ranks higher quality matches before lower quality matches in the same pool', () => {
    const exactItem = mockItem({
      id: 'chemicals',
      name: 'Chemicals',
      item_type: 'Basic Material',
      translations: { it: { name: 'Prodotti Chimici' } },
    });
    const prefixItem = mockItem({
      id: 'chemicals-pure',
      name: 'Chemicals Extra',
      item_type: 'Basic Material',
      translations: { it: { name: 'Prodotti Chimici Puri' } },
    });
    const substringItem = mockItem({
      id: 'bio-chemicals',
      name: 'Special Bio Chemicals',
      item_type: 'Basic Material',
      translations: { it: { name: 'Speciali Bio Chimici' } },
    });

    const results = rankItemsByRelevance(
      [substringItem, exactItem, prefixItem],
      'Chemicals',
      'custom_list',
      'en',
    );

    expect(results[0].id).toBe('chemicals'); // Exact match
    expect(results[1].id).toBe('chemicals-pure'); // Prefix
    expect(results[2].id).toBe('bio-chemicals'); // Token / Substring
  });

  it('prioritizes active language primary name over secondary translations', () => {
    const itemItalianPrimary = mockItem({
      id: 'item-ita',
      name: 'Wire Spool',
      item_type: 'Basic Material',
      translations: { it: { name: 'Rame' } },
    });
    const itemEnglishOnly = mockItem({
      id: 'item-eng',
      name: 'Rame Filter',
      item_type: 'Basic Material',
      translations: { it: { name: 'Filtro Speciale' } },
    });

    // In italiano, cercando "Rame":
    // item-ita ha "Rame" come nome primario esatto.
    // item-eng ha "Rame" nel nome inglese (other_name).
    const results = rankItemsByRelevance(
      [itemEnglishOnly, itemItalianPrimary],
      'Rame',
      'custom_list',
      'it',
    );

    expect(results[0].id).toBe('item-ita');
  });

  it('correctly sorts Roman numeral levels (I, II, III, IV) in natural order without length inversion', () => {
    const anvilIV = mockItem({ id: 'anvil-iv', name: 'Anvil IV', item_type: 'Weapon' });
    const anvilIII = mockItem({ id: 'anvil-iii', name: 'Anvil III', item_type: 'Weapon' });
    const anvilII = mockItem({ id: 'anvil-ii', name: 'Anvil II', item_type: 'Weapon' });
    const anvilI = mockItem({ id: 'anvil-i', name: 'Anvil I', item_type: 'Weapon' });

    const results = rankItemsByRelevance(
      [anvilIV, anvilI, anvilIII, anvilII],
      'Anvil',
      'reward',
      'en',
    );

    expect(results.map((r) => r.id)).toEqual(['anvil-i', 'anvil-ii', 'anvil-iii', 'anvil-iv']);
  });

  it('caps results to MAX_VISIBLE_RESULTS (50)', () => {
    const manyItems: ItemInfo[] = Array.from({ length: 120 }, (_, i) =>
      mockItem({
        id: `metal-${i}`,
        name: `Metal Piece ${i}`,
        item_type: 'Basic Material',
      }),
    );

    const ranked = rankItemsByRelevance(manyItems, 'metal', 'custom_list', 'en');
    expect(ranked.length).toBe(MAX_VISIBLE_RESULTS);
    expect(ranked.length).toBe(50);
  });
});
