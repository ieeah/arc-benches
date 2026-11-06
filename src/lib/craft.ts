import type { CraftInfo, CraftMode, CraftStatus, ItemInfo } from '@/types';
import { getBaseItem } from '@/lib/baseItems';

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
  itemsInfo?: Record<string, ItemInfo>
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
    const baseDef = getBaseItem(itemInfo.id);
    if (baseDef && baseDef.variantItemIds.length > 0) {
      const lvl1Id = baseDef.variantItemIds.find((id) => /-(i|1)$/i.test(id)) || baseDef.variantItemIds[0];
      const lvl1Item = itemsInfo[lvl1Id];
      if (lvl1Item && lvl1Item.id !== itemInfo.id) {
        return getCraftInfo(lvl1Item, itemsInfo);
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
  itemsInfo?: Record<string, ItemInfo>
): ItemCraftStatusResult {
  const craftInfo = getCraftInfo(itemInfo, itemsInfo);
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
