import type { CraftInfo, CraftMode, CraftStatus, ItemInfo } from '@/types';
import type {
  RecipesCatalog,
  ItemRecipeData,
  UpgradeBranch,
  UpgradeRequirement,
} from '@/types/recipes';
import recipesCatalog from '@/data/recipes.json';
import { getBaseItem, type BaseItemDefinition, type ItemVariantsFile } from '@/engine/baseItems';

// ---------------------------------------------------------------------------
// Workbenches & Crafting Status (da craft.ts)
// ---------------------------------------------------------------------------

export type WorkbenchMeta = {
  id: string;
  maxLevel: number;
};

export const WORKBENCHES_META: Record<string, WorkbenchMeta> = {
  'refiner': {
    id: 'refiner',
    maxLevel: 3,
  },
  'weapon-bench': {
    id: 'weapon-bench',
    maxLevel: 4,
  },
  'med-station': {
    id: 'med-station',
    maxLevel: 3,
  },
  'equipment-bench': {
    id: 'equipment-bench',
    maxLevel: 3,
  },
  'explosives-bench': {
    id: 'explosives-bench',
    maxLevel: 3,
  },
  'utility-bench': {
    id: 'utility-bench',
    maxLevel: 3,
  },
  'workbench': {
    id: 'workbench',
    maxLevel: 0,
  },
  'research-station': {
    id: 'research-station',
    maxLevel: 4,
  },
};

// Alias for research-bench
WORKBENCHES_META['research-bench'] = WORKBENCHES_META['research-station'];

/** Localized full display name of a workbench (e.g. "Laboratorio Medico" / "Medical Lab"). */
export const getWorkbenchName = (
  workbenchId: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string => {
  const normalizedId = workbenchId === 'research-bench' ? 'research-station' : workbenchId;
  const key = `benches.workbenchNames.${normalizedId}`;
  const translated = t(key);
  return translated && translated !== key ? translated : t('benches.defaultBench');
};

/** Localized short name of a workbench (e.g. "Armi" / "Gunsmith", "Med" / "Med Lab"). */
export const getWorkbenchShortName = (
  workbenchId: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string => {
  const normalizedId = workbenchId === 'research-bench' ? 'research-station' : workbenchId;
  const key = `benches.workbenchShortNames.${normalizedId}`;
  const translated = t(key);
  return translated && translated !== key ? translated : t('benches.defaultBench');
};

/** Localized ultra-short abbreviation for compact badges (e.g. "Ref", "Armi" / "Wpn", "Med"). */
export const getWorkbenchBadgeShort = (
  workbenchId: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string => {
  const normalizedId = workbenchId === 'research-bench' ? 'research-station' : workbenchId;
  const key = `benches.workbenchBadgeShort.${normalizedId}`;
  const translated = t(key);
  return translated && translated !== key ? translated : t('benches.defaultBenchShort');
};

/** Parses any raw MetaForge `workbench` string into a structured workbench ID and required level. */
export const parseWorkbenchRequirement = (rawWorkbench?: string | null): { workbenchId: string; levelRequired: number } | null => {
  if (!rawWorkbench) return null;
  const raw = rawWorkbench.trim().toLowerCase();
  if (!raw) return null;

  // Items that mention "basic bench" or just "workbench" can be crafted at the basic workbench (level 0, always available)
  if (raw.includes('basic bench') || raw === 'workbench') {
    return { workbenchId: 'workbench', levelRequired: 0 };
  }

  let workbenchId: string | null = null;
  if (raw.includes('refiner')) workbenchId = 'refiner';
  else if (raw.includes('med station') || raw.includes('medical lab')) workbenchId = 'med-station';
  else if (raw.includes('weapon bench') || raw.includes('gunsmith')) workbenchId = 'weapon-bench';
  else if (raw.includes('gear bench') || raw.includes('equipment bench')) workbenchId = 'equipment-bench';
  else if (raw.includes('explosive')) workbenchId = 'explosives-bench';
  else if (raw.includes('utility')) workbenchId = 'utility-bench';
  else if (raw.includes('research') || raw.includes('ricerca')) workbenchId = 'research-station';
  else if (raw.includes('workbench')) workbenchId = 'workbench';

  if (!workbenchId) return null;
  if (workbenchId === 'workbench') return { workbenchId: 'workbench', levelRequired: 0 };

  // Parse Roman numerals (I-V) or digits (1-5)
  const match = raw.match(/\b(v|iv|iii|ii|i|[1-5])\b/i);
  let levelRequired = 1;
  if (match) {
    const val = match[1].toUpperCase();
    switch (val) {
      case 'I':
      case '1':
        levelRequired = 1;
        break;
      case 'II':
      case '2':
        levelRequired = 2;
        break;
      case 'III':
      case '3':
        levelRequired = 3;
        break;
      case 'IV':
      case '4':
        levelRequired = 4;
        break;
      case 'V':
      case '5':
        levelRequired = 5;
        break;
      default: {
        const num = parseInt(val, 10);
        levelRequired = Number.isFinite(num) && num > 0 ? num : 1;
      }
    }
  }

  return { workbenchId, levelRequired };
};

let cachedBlueprintMap: Map<string, string> | null = null;
let lastItemsInfoRef: Record<string, ItemInfo> | null = null;

/** Resolves the Blueprint item ID corresponding to a craftable item ID. */
export const getBlueprintIdForItem = (
  itemId: string,
  itemsInfo?: Record<string, ItemInfo>
): string | null => {
  if (!itemId || !itemsInfo) return null;

  if (cachedBlueprintMap && lastItemsInfoRef === itemsInfo) {
    return cachedBlueprintMap.get(itemId) ?? null;
  }

  const map = new Map<string, string>();
  const allItems = Object.values(itemsInfo);
  const blueprints = allItems.filter(i => !i.hidden && (i.item_type === 'Blueprint' || i.subcategory === 'Blueprint'));

  const itemByName = new Map<string, string>();
  const itemById = new Map<string, string>();
  for (const item of allItems) {
    itemByName.set(item.name.toLowerCase().trim(), item.id);
    itemById.set(item.id.toLowerCase().trim(), item.id);
  }

  for (const bp of blueprints) {
    const idBase = bp.id.replace(/-(blueprint|recipe)$/, '');
    if (itemById.has(idBase)) {
      map.set(idBase, bp.id);
      continue;
    }
    if (itemById.has(idBase + '-i')) {
      map.set(idBase + '-i', bp.id);
      continue;
    }
    const nameBase = bp.name.replace(/ Blueprint| Recipe/i, '').trim().toLowerCase();
    const byName = itemByName.get(nameBase) || itemByName.get(nameBase + ' i');
    if (byName) {
      map.set(byName, bp.id);
    }
  }

  cachedBlueprintMap = map;
  lastItemsInfoRef = itemsInfo;
  return map.get(itemId) ?? null;
};

/** Structured crafting info for an item, taking overrides into account. */
export const getCraftInfo = (
  itemInfo?: ItemInfo,
  itemsInfo?: Record<string, ItemInfo>,
  variantsData?: ItemVariantsFile
): CraftInfo | null => {
  if (!itemInfo) return null;

  // Le armi di livello > 1 o amplificate non sono fabbricabili direttamente (#143):
  // sono ottenibili solo potenziando un'arma Lvl 1 o amplificando un'arma Lvl 4.
  const isWeapon = itemInfo.item_type === 'Weapon' || itemInfo.subcategory?.toLowerCase().includes('weapon');
  if (isWeapon) {
    const isHigherLevel = /-(ii|iii|iv|v)$/i.test(itemInfo.id);
    const isAmplified = itemInfo.rarity === 'Amplified' || /^amplified-/i.test(itemInfo.id);
    if (isHigherLevel || isAmplified) {
      return null;
    }
  }

  // Se l'oggetto è un Base Item (senza banco proprio), eredita i requisiti dalla variante Lvl 1
  if (!itemInfo.workbench && !itemInfo.craft_workbench_id && itemsInfo) {
    const baseDef = getBaseItem(itemInfo.id, variantsData);
    if (baseDef && baseDef.variantItemIds.length > 0) {
      const lvl1Id = baseDef.variantItemIds.find((id) => /-(i|1)$/i.test(id)) || baseDef.variantItemIds[0];
      const lvl1Item = itemsInfo[lvl1Id];
      if (lvl1Item && lvl1Item.id !== itemInfo.id) {
        return getCraftInfo(lvl1Item, itemsInfo, variantsData);
      }
    }
  }

  if (itemInfo.craft_workbench_id !== undefined && itemInfo.craft_level_required !== undefined) {
    if (!itemInfo.craft_workbench_id) return null;
    const recipeId = itemInfo.craft_recipe_id !== undefined
      ? itemInfo.craft_recipe_id
      : getBlueprintIdForItem(itemInfo.id, itemsInfo);
    return {
      workbenchId: itemInfo.craft_workbench_id,
      levelRequired: itemInfo.craft_level_required ?? 1,
      recipeId: recipeId ?? null,
    };
  }

  const parsed = parseWorkbenchRequirement(itemInfo.workbench);
  if (!parsed) return null;

  const recipeId = itemInfo.craft_recipe_id !== undefined
    ? itemInfo.craft_recipe_id
    : getBlueprintIdForItem(itemInfo.id, itemsInfo);

  return {
    workbenchId: parsed.workbenchId,
    levelRequired: parsed.levelRequired,
    recipeId: recipeId ?? null,
  };
};

/** Refiner level required to craft the item, or null if it can't be crafted in the refiner. (Kept for backwards compatibility) */
export const refinerCraftLevel = (itemInfo?: ItemInfo): number | null => {
  const craft = getCraftInfo(itemInfo);
  if (!craft || craft.workbenchId !== 'refiner') return null;
  return craft.levelRequired;
};

export type ItemCraftStatusResult = {
  status: CraftStatus;
  craftInfo: CraftInfo | null;
  currentBenchLevel: number;
};

/** Computes craftability status based on bench level, owned blueprints, and craft mode. */
export function getItemCraftStatus(
  itemInfo: ItemInfo | undefined,
  currentLevels: Record<string, number>,
  ownedBlueprints?: Record<string, boolean>,
  craftMode: CraftMode = 'level-only',
  itemsInfo?: Record<string, ItemInfo>,
  variantsData?: ItemVariantsFile
): ItemCraftStatusResult {
  const craftInfo = getCraftInfo(itemInfo, itemsInfo, variantsData);
  if (!craftInfo) {
    return {
      status: 'not_craftable',
      craftInfo: null,
      currentBenchLevel: 0,
    };
  }

  const { workbenchId, levelRequired, recipeId } = craftInfo;
  // Basic Workbench is always unlocked (level 0)
  const currentBenchLevel = workbenchId === 'workbench' ? 0 : (currentLevels[workbenchId] ?? 0);
  const hasLevel = currentBenchLevel >= levelRequired;

  // In strict mode: requires workbench level AND blueprint (if item has an associated blueprint)
  const requiresProject = craftMode === 'strict' && Boolean(recipeId);
  const hasProject = !requiresProject || Boolean(ownedBlueprints?.[recipeId!]);

  let status: CraftStatus;
  if (!hasLevel) {
    status = 'needs_level';
  } else if (!hasProject) {
    status = 'needs_project';
  } else {
    status = 'craftable';
  }

  return {
    status,
    craftInfo,
    currentBenchLevel,
  };
}

// ---------------------------------------------------------------------------
// Recipes, Recycling & Evolution Timeline (da recipes.ts)
// ---------------------------------------------------------------------------

const defaultCatalog = recipesCatalog as unknown as RecipesCatalog;

/**
 * Restituisce l'intera entry di ricetta e manutenzione per un dato itemId.
 */
export function getItemRecipe(
  itemId: string,
  catalog: RecipesCatalog = defaultCatalog,
): ItemRecipeData | undefined {
  if (!itemId) return undefined;
  return catalog.recipes[itemId];
}

export type RecyclingSource = {
  itemId: string;
  recyclesYield?: number;
  salvagesYield?: number;
};

// Indice inverso lazy per il riciclo parametrizzato sul catalogo
const reverseRecyclingCache = new WeakMap<RecipesCatalog, Map<string, RecyclingSource[]>>();

function buildReverseRecyclingIndex(catalog: RecipesCatalog): Map<string, RecyclingSource[]> {
  const index = new Map<string, RecyclingSource[]>();

  for (const [sourceId, entry] of Object.entries(catalog.recipes)) {
    if (!entry.recycling) continue;
    const { recyclesInto, salvagesInto } = entry.recycling;

    const touched = new Set<string>();
    if (recyclesInto) {
      Object.keys(recyclesInto).forEach((k) => touched.add(k));
    }
    if (salvagesInto) {
      Object.keys(salvagesInto).forEach((k) => touched.add(k));
    }

    for (const targetId of touched) {
      const recYield = recyclesInto?.[targetId];
      const salYield = salvagesInto?.[targetId];
      let list = index.get(targetId);
      if (!list) {
        list = [];
        index.set(targetId, list);
      }
      list.push({
        itemId: sourceId,
        recyclesYield: recYield,
        salvagesYield: salYield,
      });
    }
  }

  // Ordina per resa totale decrescente
  for (const list of index.values()) {
    list.sort((a, b) => {
      const yieldA = Math.max(a.recyclesYield ?? 0, a.salvagesYield ?? 0);
      const yieldB = Math.max(b.recyclesYield ?? 0, b.salvagesYield ?? 0);
      return yieldB - yieldA;
    });
  }

  return index;
}

/**
 * Restituisce l'elenco degli oggetti che, una volta riciclati o smantellati,
 * producono l'oggetto target specificato.
 */
export function getRecyclingSources(
  targetItemId: string,
  catalog: RecipesCatalog = defaultCatalog,
): RecyclingSource[] {
  if (!targetItemId) return [];
  let index = reverseRecyclingCache.get(catalog);
  if (!index) {
    index = buildReverseRecyclingIndex(catalog);
    reverseRecyclingCache.set(catalog, index);
  }
  return index.get(targetItemId) ?? [];
}

export type EvolutionStep = {
  fromItemId: string;
  toItemId: string;
  fromLevelName: string;
  toLevelName: string;
  ingredients: Record<string, number>;
  requires?: UpgradeRequirement[];
  isAmplified?: boolean;
};

/**
 * Costruisce la scaletta evolutiva completa per un Base Item (es. Anvil I -> II -> III -> IV -> Amplificazioni).
 */
export function getEvolutionTimeline(
  baseDef: BaseItemDefinition,
  catalog: RecipesCatalog = defaultCatalog,
): {
  steps: EvolutionStep[];
  amplificationBranches: EvolutionStep[];
} {
  const steps: EvolutionStep[] = [];
  const amplificationBranches: EvolutionStep[] = [];

  const tierOrder = ['i', 'ii', 'iii', 'iv', 'v'];

  // Cerca le varianti ordinate per livello romano
  const tierIds: { tier: string; itemId: string; levelNum: number }[] = [];
  for (const vId of baseDef.variantItemIds) {
    const match = vId.match(/-(i|ii|iii|iv|v)$/i);
    if (match) {
      const tier = match[1].toLowerCase();
      const levelNum = tierOrder.indexOf(tier) + 1;
      tierIds.push({ tier, itemId: vId, levelNum });
    }
  }

  tierIds.sort((a, b) => a.levelNum - b.levelNum);

  // Costruisci gli step sequenziali di livello (es. I -> II -> III -> IV)
  for (let i = 0; i < tierIds.length - 1; i++) {
    const curr = tierIds[i];
    const next = tierIds[i + 1];
    const currRecipe = getItemRecipe(curr.itemId, catalog);
    const branch = currRecipe?.upgrade?.branches?.find((b: UpgradeBranch) => b.to === next.itemId);
    const cost = branch?.cost || currRecipe?.upgrade?.upgradeCost;

    if (cost && Object.keys(cost).length > 0) {
      steps.push({
        fromItemId: curr.itemId,
        toItemId: next.itemId,
        fromLevelName: `Lvl ${curr.tier.toUpperCase()}`,
        toLevelName: `Lvl ${next.tier.toUpperCase()}`,
        ingredients: cost,
        requires: branch?.requires,
        isAmplified: false,
      });
    }
  }

  // Cerca i rami di amplificazione (tipicamente dal livello massimo, es. IV)
  const maxTier = tierIds[tierIds.length - 1];
  if (maxTier) {
    const maxRecipe = getItemRecipe(maxTier.itemId, catalog);
    const branches = maxRecipe?.upgrade?.branches || [];
    for (const b of branches) {
      if (b.to && b.to !== maxTier.itemId && !tierIds.some((t) => t.itemId === b.to)) {
        amplificationBranches.push({
          fromItemId: maxTier.itemId,
          toItemId: b.to,
          fromLevelName: `Lvl ${maxTier.tier.toUpperCase()}`,
          toLevelName: 'Amplificato',
          ingredients: b.cost,
          requires: b.requires,
          isAmplified: true,
        });
      }
    }
  }

  return { steps, amplificationBranches };
}

/**
 * Restituisce i potenziamenti pertinenti per una specifica variante:
 * - Se non è al livello massimo, restituisce solo il prossimo livello (es. II -> III).
 * - Se è al livello massimo (IV) o amplificata, restituisce i rami di amplificazione.
 */
export function getNextUpgradeStep(
  itemId: string,
  catalog: RecipesCatalog = defaultCatalog,
): {
  nextStep?: EvolutionStep;
  amplificationBranches: EvolutionStep[];
} {
  const recipe = getItemRecipe(itemId, catalog);
  const amplificationBranches: EvolutionStep[] = [];

  if (!recipe?.upgrade) {
    return { amplificationBranches: [] };
  }

  const branches = recipe.upgrade.branches || [];

  // Se l'oggetto ha upgradesTo esplicito (es. anvil-ii -> anvil-iii)
  const upgradesTo = recipe.upgrade.upgradesTo;
  const isUpgradesToAmplified = upgradesTo && /^amplified-/i.test(upgradesTo);

  let nextStep: EvolutionStep | undefined;

  if (upgradesTo && !isUpgradesToAmplified) {
    const branch = branches.find((b: UpgradeBranch) => b.to === upgradesTo);
    const cost = branch?.cost || recipe.upgrade.upgradeCost;
    if (cost && Object.keys(cost).length > 0) {
      const matchCurr = itemId.match(/-(i|ii|iii|iv|v)$/i);
      const matchNext = upgradesTo.match(/-(i|ii|iii|iv|v)$/i);
      nextStep = {
        fromItemId: itemId,
        toItemId: upgradesTo,
        fromLevelName: matchCurr ? `Lvl ${matchCurr[1].toUpperCase()}` : itemId,
        toLevelName: matchNext ? `Lvl ${matchNext[1].toUpperCase()}` : upgradesTo,
        ingredients: cost,
        requires: branch?.requires,
        isAmplified: false,
      };
    }
  }

  // Raccogli eventuali rami amplificati
  for (const b of branches) {
    if (/^amplified-/i.test(b.to) || b.to.includes('amplified')) {
      amplificationBranches.push({
        fromItemId: itemId,
        toItemId: b.to,
        fromLevelName: 'Lvl IV',
        toLevelName: 'Amplificato',
        ingredients: b.cost,
        requires: b.requires,
        isAmplified: true,
      });
    }
  }

  return { nextStep, amplificationBranches };
}

/**
 * Normalizza il nome visualizzato per una stazione/banco di crafting o riparazione.
 */
export function getStationDisplayName(stationId: string): string {
  switch (stationId) {
    case 'in-raid':
    case 'in_raid':
      return 'In Raid';
    case 'workbench':
      return 'Banco Base';
    case 'weapon-bench':
    case 'weapon_bench':
    case 'gunsmith':
      return 'Banco Armi (Gunsmith)';
    case 'med-station':
    case 'medical':
      return 'Banco Medico';
    case 'gear-bench':
    case 'gear_bench':
      return 'Banco Equipaggiamento';
    case 'explosives-bench':
    case 'explosives_bench':
      return 'Banco Esplosivi';
    case 'refiner':
      return 'Raffineria';
    default:
      return stationId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
