import type { ItemInfo } from '@/types';
import seedData from '@/data/item-variants.json';

export type BaseItemDefinition = {
  id: string;
  name: string;
  item_type: string;
  subcategory?: string | null;
  rarity?: string;
  icon?: string;
  description?: string;
  translations?: Record<string, { name?: string; description?: string }>;
  variantItemIds: string[];
  blueprintItemId?: string;
};

export type ItemVariantsFile = {
  baseItems: Record<string, BaseItemDefinition>;
};

const defaultVariantsData = seedData as ItemVariantsFile;

/** Mappa di tutti i Base Item per ID. */
export function getBaseItemsMap(
  data: ItemVariantsFile = defaultVariantsData,
): Record<string, BaseItemDefinition> {
  return data.baseItems || {};
}

/** Recupera un singolo Base Item per ID. */
export function getBaseItem(
  id: string,
  data: ItemVariantsFile = defaultVariantsData,
): BaseItemDefinition | undefined {
  return getBaseItemsMap(data)[id];
}

/** Mappa inversa: variantItemId -> BaseItemDefinition. */
export function getVariantToBaseItemMap(
  data: ItemVariantsFile = defaultVariantsData,
): Map<string, BaseItemDefinition> {
  const baseMap = getBaseItemsMap(data);
  const map = new Map<string, BaseItemDefinition>();
  for (const base of Object.values(baseMap)) {
    for (const vId of base.variantItemIds) {
      map.set(vId, base);
    }
  }
  return map;
}

/** Verifica se un ID oggetto corrisponde a un Base Item che raggruppa varianti. */
export function isBaseItem(
  itemId: string,
  data: ItemVariantsFile = defaultVariantsData,
): boolean {
  return Boolean(getBaseItem(itemId, data)?.variantItemIds?.length);
}

/** Verifica se un ID oggetto è registrato come variante di un qualsiasi Base Item. */
export function isVariantItem(
  itemId: string,
  data: ItemVariantsFile = defaultVariantsData,
): boolean {
  return getVariantToBaseItemMap(data).has(itemId);
}

/** Recupera il Base Item a cui appartiene una variante. */
export function getBaseItemForVariant(
  itemId: string,
  data: ItemVariantsFile = defaultVariantsData,
): BaseItemDefinition | undefined {
  return getVariantToBaseItemMap(data).get(itemId);
}

/**
 * Converte una definizione `BaseItemDefinition` in un `ItemInfo` completo,
 * utilizzabile in modo trasparente in tutte le card, picker e liste dell'app.
 */
export function baseItemToItemInfo(base: BaseItemDefinition): ItemInfo {
  return {
    id: base.id,
    name: base.name,
    description: base.description || '',
    icon: base.icon || 'icons/default.webp',
    rarity: base.rarity || 'Common',
    item_type: base.item_type,
    subcategory: base.subcategory ?? null,
    value: 0,
    workbench: null,
    loot_area: null,
    stack_size: 1,
    translations: base.translations || {},
  };
}

/**
 * Suggeritore automatico per il Dev Studio:
 * analizza il catalogo per proporre oggetti candidati da associare a un Base Item
 * in base al nome, all'ID, e alla tipologia/sottocategoria.
 */
export function getSuggestedVariants(
  baseNameOrId: string,
  allItems: ItemInfo[],
  alreadyAssigned: Set<string>,
  data: ItemVariantsFile = defaultVariantsData,
): ItemInfo[] {
  const query = baseNameOrId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (!query) return [];

  return allItems.filter((item) => {
    if (alreadyAssigned.has(item.id)) return false;
    if (isBaseItem(item.id, data)) return false;
    if (item.item_type === 'Blueprint') return false;

    const normId = item.id.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const normName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '');

    // Match se l'ID o il nome contengono la query del base item
    return normId.includes(query) || normName.includes(query);
  });
}

/**
 * Recupera l'oggetto prodotto (o il Base Item collegato) da un Blueprint.
 * Supporta:
 * 1. Mappatura esplicita blueprintItemId nei Base Items.
 * 2. Risoluzione euristica su ID (es. anvil-recipe -> anvil-i o anvil).
 * 3. Risoluzione euristica per nome.
 */
export function getProducedItemForBlueprint(
  blueprintId: string,
  itemsInfo: Record<string, ItemInfo>,
  data: ItemVariantsFile = defaultVariantsData,
): ItemInfo | undefined {
  const baseMap = getBaseItemsMap(data);

  // 1. Cerca nei Base Items configurati
  for (const base of Object.values(baseMap)) {
    if (base.blueprintItemId === blueprintId) {
      const tier1 = base.variantItemIds.find((vId) => vId.endsWith('-i') && itemsInfo[vId]);
      if (tier1) return itemsInfo[tier1];
      const anyVariant = base.variantItemIds.find((vId) => itemsInfo[vId]);
      if (anyVariant) return itemsInfo[anyVariant];
      if (itemsInfo[base.id]) return itemsInfo[base.id];
      return baseItemToItemInfo(base);
    }
  }

  // 2. Risoluzione euristica su ID
  const bpItem = itemsInfo[blueprintId];
  const strippedId = blueprintId.replace(/-(recipe|blueprint|bp)$/i, '');
  if (itemsInfo[strippedId]) return itemsInfo[strippedId];
  if (itemsInfo[`${strippedId}-i`]) return itemsInfo[`${strippedId}-i`];

  // 3. Risoluzione euristica per nome
  if (bpItem) {
    const cleanName = bpItem.name.replace(/\s+(Blueprint|Recipe|Schema)$/i, '').trim().toLowerCase();
    for (const item of Object.values(itemsInfo)) {
      if (item.id === blueprintId) continue;
      if (item.item_type === 'Blueprint' || item.subcategory === 'Blueprint') continue;
      if (item.name.toLowerCase() === cleanName) {
        return item;
      }
    }
    for (const item of Object.values(itemsInfo)) {
      if (item.id === blueprintId) continue;
      if (item.item_type === 'Blueprint' || item.subcategory === 'Blueprint') continue;
      if (item.name.toLowerCase().startsWith(cleanName)) {
        return item;
      }
    }
  }

  return undefined;
}
