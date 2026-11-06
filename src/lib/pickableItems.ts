import type { ItemInfo } from '@/types';
import type { AppLanguage } from '@/i18n/types';
import { getItemName } from '@/i18n';
import { isVariantItem, getBaseItem, getBaseItemForVariant } from '@/lib/baseItems';
import { fuzzyMatch, normalize } from '@/lib/fuzzy';

/**
 * Tipi che non si possono trovare né portare in raid: mai un requisito di consegna.
 * Mantenuto per retrocompatibilità.
 */
export const NON_DELIVERABLE_ITEM_TYPES: ReadonlySet<string> = new Set([
  'Blueprint', 'Cosmetic', 'Outfits', 'Furniture', 'Research', 'Currency',
]);

/** Limite massimo di card renderizzate nel DOM per salvaguardare le performance mobile */
export const MAX_VISIBLE_RESULTS = 50;

/** Contesti semantici di invocazione dell'ItemPicker */
export type ItemPickerContext =
  | 'raid'          // Pianificazione raid (materiali, consumabili, blueprint/design droppabili)
  | 'custom_list'   // Liste personalizzate create dall'utente
  | 'dev_action'    // Requisiti azioni di livello e consegne
  | 'dev_list'      // Fabbisogno livelli banchi, progetti, outpost
  | 'reward';       // Ricompense pass, quest e backoffice (tutto il catalogo valido)

/** Fascia di appartenenza per la ricerca contestuale */
export type ItemPoolTier = 1 | 2; // 1 = Standard/Primario, 2 = Extra/Secondario (Pool 3 = escluso)

export type PickableOptions = {
  /** Contesto semantico dell'ItemPicker */
  context?: ItemPickerContext;
  /** Ricompense: qualsiasi oggetto del catalogo (blueprint, cosmetici, valute…). Deprecato: usa context="reward" */
  includeAll?: boolean;
  /** Includi i blueprint (es. raid planning). Deprecato: usa context="raid" */
  includeBlueprints?: boolean;
  /** Oggetti già scelti: esclusi dall'elenco. */
  excludedIds?: ReadonlySet<string>;
};

type ContextPoolConfig = {
  pool1: ReadonlySet<string>;
  pool2: ReadonlySet<string>;
};

const MATERIALS_AND_SUPPLIES: string[] = [
  'Basic Material',
  'Refined Material',
  'Topside Material',
  'Recyclable',
  'Nature',
  'Material', // fallback/mock
];

export const CONTEXT_POOLS: Record<ItemPickerContext, ContextPoolConfig> = {
  raid: {
    pool1: new Set([
      ...MATERIALS_AND_SUPPLIES,
      'Quick Use',
      'Modification',
      'Shield',
      'Ammunition',
      'Trinket',
      'Research Item',
      'Key',
      'Quest Item',
    ]),
    pool2: new Set([
      'Blueprint',
      'Stencil',
      'Design',
      'Weapon',
      'Augment',
    ]),
  },
  custom_list: {
    pool1: new Set([
      ...MATERIALS_AND_SUPPLIES,
      'Quick Use',
      'Trinket',
      'Research Item',
      'Key',
      'Quest Item',
      'Ammunition',
      'Shield',
      'Modification',
    ]),
    pool2: new Set([
      'Blueprint',
      'Weapon',
      'Augment',
      'Stencil',
      'Design',
    ]),
  },
  dev_action: {
    pool1: new Set([
      ...MATERIALS_AND_SUPPLIES,
      'Quick Use',
      'Trinket',
      'Research Item',
      'Key',
      'Quest Item',
    ]),
    pool2: new Set([
      'Blueprint',
      'Weapon',
      'Augment',
      'Shield',
      'Modification',
      'Stencil',
      'Design',
      'Currency',
      'Ammunition',
    ]),
  },
  dev_list: {
    pool1: new Set([
      ...MATERIALS_AND_SUPPLIES,
      'Quick Use',
      'Trinket',
      'Research Item',
      'Key',
      'Quest Item',
    ]),
    pool2: new Set([
      'Blueprint',
      'Weapon',
      'Augment',
      'Shield',
      'Modification',
      'Stencil',
      'Design',
      'Currency',
      'Ammunition',
    ]),
  },
  reward: {
    pool1: new Set([
      'Blueprint',
      'Cosmetic',
      'Outfits',
      'Weapon',
      'Augment',
      'Modification',
      'Quick Use',
      'Currency',
      'Trinket',
      'Furniture',
    ]),
    pool2: new Set([
      ...MATERIALS_AND_SUPPLIES,
      'Shield',
      'Ammunition',
      'Design',
      'Stencil',
      'Key',
      'Quest Item',
      'Research Item',
      'Research',
    ]),
  },
};

/**
 * Restituisce il pool di appartenenza (1 o 2) di un oggetto per un dato contesto,
 * oppure null se l'oggetto appartiene al Pool 3 (Escluso) o è nascosto/deprecato/escluso.
 */
export function getItemPoolTier(
  item: ItemInfo,
  context: ItemPickerContext,
  excludedIds?: ReadonlySet<string>,
): ItemPoolTier | null {
  if (excludedIds?.has(item.id)) return null;
  if (item.hidden || item.deprecated) return null;
  // Nei contesti operativi (raid, custom list, azioni dev) le varianti specifiche
  // sono collassate nel rispettivo Base Item. Solo nelle ricompense è possibile
  // assegnare direttamente una variante specifica o livello IV.
  if (context !== 'reward' && isVariantItem(item.id)) return null;
  // Al contrario, nelle ricompense si ottiene sempre un livello o variante specifica (es. Anvil IV);
  // il Base Item astratto/aggregatore non è un oggetto di gioco ottenibile ed è quindi escluso.
  if (context === 'reward' && Boolean(getBaseItem(item.id)?.variantItemIds?.length)) return null;

  const config = CONTEXT_POOLS[context];
  if (!config) return null;

  if (config.pool1.has(item.item_type)) return 1;
  if (config.pool2.has(item.item_type)) return 2;
  return null;
}

/**
 * Determina se un oggetto è selezionabile per le opzioni fornite.
 * Mantiene la compatibilità con includeAll e includeBlueprints.
 */
export function isPickableItem(
  item: ItemInfo,
  { context, includeAll = false, includeBlueprints = false, excludedIds }: PickableOptions = {},
): boolean {
  let effectiveContext: ItemPickerContext = context ?? 'custom_list';
  if (includeAll) effectiveContext = 'reward';
  else if (includeBlueprints) effectiveContext = 'raid';

  return getItemPoolTier(item, effectiveContext, excludedIds) !== null;
}

/**
 * Calcola il livello di corrispondenza qualitativa tra una stringa candidata e la query normalizzata.
 * 0 = match esatto
 * 1 = prefisso stringa intera
 * 2 = prefisso parola/token
 * 3 = sottostringa contigua
 * 4 = match sottosequenza fuzzy
 * 5 = nessuna corrispondenza
 */
function getMatchQuality(rawCandidate: string, normQuery: string): number {
  if (!rawCandidate || !normQuery) return 5;
  const norm = normalize(rawCandidate);
  if (norm === normQuery) return 0;
  if (norm.startsWith(normQuery)) return 1;
  const words = norm.split(/[\s-]+/);
  if (words.some((w) => w.startsWith(normQuery))) return 2;
  if (norm.includes(normQuery)) return 3;
  if (fuzzyMatch(rawCandidate, normQuery)) return 4;
  return 5;
}

/**
 * Punteggio composito per (fieldTier, quality).
 * fieldTier: 0 = lingua primaria attiva, 1 = altre lingue/varianti, 2 = id tecnico.
 */
function getCompositeMatchScore(fieldTier: number, quality: number): number {
  if (quality >= 5) return 999;
  return quality * 30 + fieldTier * 10;
}

const ROMAN_NUMERALS: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
};

/**
 * Normalizza numeri romani (I-X) e supporta ordinamento numerico naturale.
 * Evita anomalie in cui "IV" (2 caratteri) viene ordinato prima di "III" (3 caratteri).
 */
function normalizeForNaturalSort(str: string): string {
  return str.replace(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)\b/gi, (match) => {
    const val = ROMAN_NUMERALS[match.toUpperCase()];
    return val !== undefined ? String(val).padStart(2, '0') : match;
  });
}

/**
 * Ordina una lista di ItemInfo per pertinenza rispetto alla query cercata e al contesto,
 * e limita l'output a maxResults (default MAX_VISIBLE_RESULTS = 50).
 */
export function rankItemsByRelevance(
  items: ItemInfo[],
  query: string,
  context: ItemPickerContext,
  language: string,
  itemsInfo: Record<string, ItemInfo> = {},
  maxResults: number = MAX_VISIBLE_RESULTS,
): ItemInfo[] {
  const trimmed = query.trim();
  const normQuery = normalize(trimmed);
  const lang = (language ?? 'en') as AppLanguage;

  // Se la query è vuota, ordina semplicemente per pool e ordine naturale/alfabetico
  if (!normQuery) {
    const list = [...items].sort((a, b) => {
      const poolA = getItemPoolTier(a, context) ?? 2;
      const poolB = getItemPoolTier(b, context) ?? 2;
      if (poolA !== poolB) return poolA - poolB;
      const nameA = getItemName(a, lang);
      const nameB = getItemName(b, lang);
      return normalizeForNaturalSort(nameA).localeCompare(
        normalizeForNaturalSort(nameB),
        language,
        { numeric: true },
      );
    });
    return list.slice(0, maxResults);
  }

  type ScoredItem = {
    item: ItemInfo;
    score: number;
    displayName: string;
  };

  const scored: ScoredItem[] = [];

  for (const item of items) {
    const poolTier = getItemPoolTier(item, context) ?? 2;
    const poolPenalty = (poolTier - 1) * 1000;

    const displayName = getItemName(item, lang);

    // 1. Campo primario (lingua attiva)
    const primaryQuality = getMatchQuality(displayName, normQuery);
    let bestFieldScore = getCompositeMatchScore(0, primaryQuality);

    // 2. Altri nomi (inglese, traduzioni, varianti/base collegate)
    const otherNames: string[] = [];
    if (item.name !== displayName) {
      otherNames.push(item.name);
    }
    if (item.translations) {
      for (const tr of Object.values(item.translations)) {
        if (tr.name && tr.name !== displayName) {
          otherNames.push(tr.name);
        }
      }
    }

    const baseDef = getBaseItem(item.id);
    if (baseDef) {
      if (baseDef.name !== displayName) otherNames.push(baseDef.name);
      if (baseDef.translations) {
        for (const tr of Object.values(baseDef.translations)) {
          if (tr.name && tr.name !== displayName) otherNames.push(tr.name);
        }
      }
      for (const vId of baseDef.variantItemIds) {
        const vItem = itemsInfo[vId];
        if (vItem) {
          if (vItem.name !== displayName) otherNames.push(vItem.name);
          if (vItem.translations) {
            for (const tr of Object.values(vItem.translations)) {
              if (tr.name && tr.name !== displayName) otherNames.push(tr.name);
            }
          }
        }
      }
    }

    const parentBase = getBaseItemForVariant(item.id);
    if (parentBase) {
      if (parentBase.name !== displayName) otherNames.push(parentBase.name);
    }

    for (const name of otherNames) {
      const q = getMatchQuality(name, normQuery);
      const s = getCompositeMatchScore(1, q);
      if (s < bestFieldScore) {
        bestFieldScore = s;
      }
    }

    // 3. ID tecnico
    const idCandidates = [item.id];
    if (baseDef) {
      idCandidates.push(...baseDef.variantItemIds);
    }

    for (const idStr of idCandidates) {
      const q = getMatchQuality(idStr, normQuery);
      const s = getCompositeMatchScore(2, q);
      if (s < bestFieldScore) {
        bestFieldScore = s;
      }
    }

    // Se non corrisponde affatto e c'è una query attiva, ignora l'oggetto
    if (bestFieldScore >= 999) {
      continue;
    }

    scored.push({
      item,
      score: poolPenalty + bestFieldScore,
      displayName,
    });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    // A parità di punteggio, ordina per nome naturale (supportando numeri arabi e romani I-X)
    const naturalCmp = normalizeForNaturalSort(a.displayName).localeCompare(
      normalizeForNaturalSort(b.displayName),
      language,
      { numeric: true },
    );
    if (naturalCmp !== 0) return naturalCmp;
    return a.item.id.localeCompare(b.item.id);
  });

  return scored.slice(0, maxResults).map((s) => s.item);
}
