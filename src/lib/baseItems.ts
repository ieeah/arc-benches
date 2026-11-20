import type { ItemInfo } from '@/types';
import seedData from '@/data/item-variants.json';
import { safeLS } from '@/lib/safeStorage';
import {
  type BaseItemDefinition,
  type ItemVariantsFile,
  getBaseItemsMap as engineGetBaseItemsMap,
  getBaseItem as engineGetBaseItem,
  getVariantToBaseItemMap as engineGetVariantToBaseItemMap,
  isBaseItem as engineIsBaseItem,
  isVariantItem as engineIsVariantItem,
  getBaseItemForVariant as engineGetBaseItemForVariant,
  baseItemToItemInfo,
  getSuggestedVariants as engineGetSuggestedVariants,
  getProducedItemForBlueprint as engineGetProducedItemForBlueprint,
} from '@/engine/baseItems';

export type { BaseItemDefinition, ItemVariantsFile };
export { baseItemToItemInfo };

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
  return engineGetBaseItemsMap(getItemVariantsData());
}

/** Recupera un singolo Base Item per ID. */
export function getBaseItem(id: string): BaseItemDefinition | undefined {
  return engineGetBaseItem(id, getItemVariantsData());
}

/** Mappa inversa: variantItemId -> BaseItemDefinition. */
export function getVariantToBaseItemMap(): Map<string, BaseItemDefinition> {
  return engineGetVariantToBaseItemMap(getItemVariantsData());
}

/** Verifica se un ID oggetto corrisponde a un Base Item che raggruppa varianti. */
export function isBaseItem(itemId: string): boolean {
  return engineIsBaseItem(itemId, getItemVariantsData());
}

/** Verifica se un ID oggetto è registrato come variante di un qualsiasi Base Item. */
export function isVariantItem(itemId: string): boolean {
  return engineIsVariantItem(itemId, getItemVariantsData());
}

/** Recupera il Base Item a cui appartiene una variante. */
export function getBaseItemForVariant(itemId: string): BaseItemDefinition | undefined {
  return engineGetBaseItemForVariant(itemId, getItemVariantsData());
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
  return engineGetSuggestedVariants(baseNameOrId, allItems, alreadyAssigned, getItemVariantsData());
}

/**
 * Recupera l'oggetto prodotto (o il Base Item collegato) da un Blueprint.
 */
export function getProducedItemForBlueprint(
  blueprintId: string,
  itemsInfo: Record<string, ItemInfo>,
): ItemInfo | undefined {
  return engineGetProducedItemForBlueprint(blueprintId, itemsInfo, getItemVariantsData());
}
