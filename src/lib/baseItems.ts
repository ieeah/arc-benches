import type { ItemInfo } from '@/types';
import seedData from '@/data/item-variants.json';
import { safeLS } from '@/lib/safeStorage';

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

export const VARIANTS_DRAFT_KEY = 'arc_benches_item_variants_draft_v1';
export const VARIANTS_CHANGED_EVENT = 'arc-benches:item-variants-changed';

/** Restituisce i dati dei base items attivi (con bozza locale da Dev Studio se presente). */
export function getItemVariantsData(): ItemVariantsFile {
  return safeLS(() => {
    if (typeof localStorage === 'undefined') return seedData as ItemVariantsFile;
    const raw = localStorage.getItem(VARIANTS_DRAFT_KEY);
    if (!raw) return seedData as ItemVariantsFile;
    try {
      const parsed = JSON.parse(raw) as ItemVariantsFile;
      if (parsed && typeof parsed.baseItems === 'object') return parsed;
    } catch {
      // ignore parse error
    }
    return seedData as ItemVariantsFile;
  }, seedData as ItemVariantsFile);
}

/** Verifica se è presente una bozza locale modificata rispetto al file su disco. */
export function hasItemVariantsDraft(): boolean {
  return safeLS(() => {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(VARIANTS_DRAFT_KEY);
    if (!raw) return false;
    return raw !== JSON.stringify(seedData);
  }, false);
}

/** Salva una bozza locale delle relazioni Base Items / Varianti. */
export function saveItemVariantsDraft(data: ItemVariantsFile): void {
  safeLS(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(VARIANTS_DRAFT_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(VARIANTS_CHANGED_EVENT, { detail: data }));
    }
  }, undefined);
}

/** Cancella la bozza locale ripristinando il file seed su disco. */
export function clearItemVariantsDraft(): void {
  safeLS(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(VARIANTS_DRAFT_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(VARIANTS_CHANGED_EVENT, { detail: seedData }));
    }
  }, undefined);
}

/** Mappa di tutti i Base Item per ID. */
export function getBaseItemsMap(): Record<string, BaseItemDefinition> {
  return getItemVariantsData().baseItems || {};
}

/** Recupera un singolo Base Item per ID. */
export function getBaseItem(id: string): BaseItemDefinition | undefined {
  return getBaseItemsMap()[id];
}

/** Mappa inversa: variantItemId -> BaseItemDefinition. */
export function getVariantToBaseItemMap(): Map<string, BaseItemDefinition> {
  const baseMap = getBaseItemsMap();
  const map = new Map<string, BaseItemDefinition>();
  for (const base of Object.values(baseMap)) {
    for (const vId of base.variantItemIds) {
      map.set(vId, base);
    }
  }
  return map;
}

/** Verifica se un ID oggetto corrisponde a un Base Item che raggruppa varianti. */
export function isBaseItem(itemId: string): boolean {
  return Boolean(getBaseItem(itemId)?.variantItemIds?.length);
}

/** Verifica se un ID oggetto è registrato come variante di un qualsiasi Base Item. */
export function isVariantItem(itemId: string): boolean {
  return getVariantToBaseItemMap().has(itemId);
}

/** Recupera il Base Item a cui appartiene una variante. */
export function getBaseItemForVariant(itemId: string): BaseItemDefinition | undefined {
  return getVariantToBaseItemMap().get(itemId);
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
): ItemInfo[] {
  const query = baseNameOrId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (!query) return [];

  return allItems.filter((item) => {
    if (alreadyAssigned.has(item.id)) return false;
    if (isBaseItem(item.id)) return false;
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
): ItemInfo | undefined {
  const baseMap = getBaseItemsMap();

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
