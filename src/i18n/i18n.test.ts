import { describe, it, expect } from 'vitest';
import { translate, getItemName, getItemDescription, getItemSearchFields, getRarityLabel } from './index';
import type { ItemInfo } from '@/types';

describe('i18n core engine', () => {
  it('translates static keys for Italian and English', () => {
    expect(translate('it', 'nav.stash')).toBe('Stash');
    expect(translate('en', 'nav.stash')).toBe('Stash');
    expect(translate('it', 'nav.settings')).toBe('Impostazioni');
    expect(translate('en', 'nav.settings')).toBe('Settings');
    expect(translate('it', 'stash.emptyTitle')).toBe('Nessun materiale richiesto');
    expect(translate('en', 'stash.emptyTitle')).toBe('No materials required');
  });

  it('interpolates {param} placeholders correctly', () => {
    expect(translate('it', 'customLists.deleteItemConfirm', { name: 'Cavi' })).toBe('Vuoi rimuovere "Cavi" dalla lista?');
    expect(translate('en', 'customLists.deleteItemConfirm', { name: 'Wires' })).toBe('Do you want to remove "Wires" from the list?');
    expect(translate('it', 'customLists.deleteItemStage', { level: 2 })).toBe("L'oggetto verrà rimosso dal Livello 2.");
    expect(translate('en', 'customLists.deleteItemStage', { level: 2 })).toBe('The item will be removed from Level 2.');
  });

  it('falls back to key path when translation is completely missing', () => {
    expect(translate('en', 'nonexistent.key.path')).toBe('nonexistent.key.path');
  });
});

describe('item localization & multi-language search', () => {
  const mockItem: ItemInfo = {
    id: 'metal-parts',
    name: 'Metal Parts',
    description: 'Scrap metal for basic crafting.',
    item_type: 'Basic Material',
    value: 50,
    rarity: 'Common',
    icon: 'metal-parts.png',
    subcategory: null,
    workbench: null,
    loot_area: null,
    stack_size: 100,
    translations: {
      it: {
        name: 'Parti metalliche',
        description: 'Metallo di scarto per il crafting di base.',
      },
    },
  };

  const itemWithoutTranslations: ItemInfo = {
    id: 'simple-gear',
    name: 'Simple Gear',
    description: 'A basic mechanical gear.',
    item_type: 'Basic Material',
    value: 30,
    rarity: 'Uncommon',
    icon: 'simple-gear.png',
    subcategory: null,
    workbench: null,
    loot_area: null,
    stack_size: 50,
  };

  it('resolves localized item name with fallback to English default', () => {
    expect(getItemName(mockItem, 'it')).toBe('Parti metalliche');
    expect(getItemName(mockItem, 'en')).toBe('Metal Parts');
    expect(getItemName(itemWithoutTranslations, 'it')).toBe('Simple Gear');
    expect(getItemName(itemWithoutTranslations, 'en')).toBe('Simple Gear');
  });

  it('resolves localized item description with fallback to English default', () => {
    expect(getItemDescription(mockItem, 'it')).toBe('Metallo di scarto per il crafting di base.');
    expect(getItemDescription(mockItem, 'en')).toBe('Scrap metal for basic crafting.');
    expect(getItemDescription(itemWithoutTranslations, 'it')).toBe('A basic mechanical gear.');
  });

  it('generates multi-language search fields containing localized names, English name, and ID', () => {
    const searchFields = getItemSearchFields(mockItem);
    expect(searchFields).toContain('Metal Parts');
    expect(searchFields).toContain('metal-parts');
    expect(searchFields).toContain('Parti metalliche');
  });

  it('localizes rarity labels', () => {
    expect(getRarityLabel('Common', 'it')).toBe('Comune');
    expect(getRarityLabel('Common', 'en')).toBe('Common');
    expect(getRarityLabel('Epic', 'it')).toBe('Epico');
    expect(getRarityLabel('Epic', 'en')).toBe('Epic');
  });

  it('correctly reflects items-overrides.json and drafts on effective items', async () => {
    const { computeEffectiveItemsInfo } = await import('@/store/gameData');
    const effective = computeEffectiveItemsInfo();

    // surveyor-vault has override in items-overrides.json
    expect(effective['surveyor-vault']).toBeDefined();
    expect(getItemName(effective['surveyor-vault'], 'it')).toBe('Cassaforte del supervisore');
    expect(getItemName(effective['surveyor-vault'], 'en')).toBe('Surveyor Vault');
  });
});
