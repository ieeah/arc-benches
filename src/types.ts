export interface ItemRequirement {
  itemId: string;
  quantity: number;
}

export interface ListLevel {
  level: number;
  requirementItemIds: ItemRequirement[];
}

/** Semantic category of a list, orthogonal to `custom` (a custom list may also be a project, etc.). */
export type ListType = 'workbench' | 'project' | 'quest' | 'custom';

/**
 * A tracked list of materials by level — the generic engine. The game's hideout workbenches are
 * the read-only seed (`listType: 'workbench'`); custom lists are user-created instances.
 */
export interface List {
  id: string;
  name: string;
  maxLevel: number;
  levels: ListLevel[];
  /** true = user-created (per-profile, persisted); absent/false = game seed (read-only). */
  custom?: boolean;
  /** Category for labels/icons/grouping; defaults to 'workbench' for game seed. */
  listType?: ListType;
}

export interface ItemInfo {
  id: string;
  name: string;
  description: string;
  icon: string | null; // local path relative to BASE_URL (e.g. "icons/items/lemon.webp")
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | string;
  item_type: string;
  subcategory: string | null;
  value: number;
  workbench: string | null;
  loot_area: string | null;
  stack_size: number | null;
}

export interface ListExportEntry {
  list: List;
  currentLevel: number;
  targetLevel: number;
  active: boolean;
}

export interface ListExportFile {
  version: 1;
  exportedAt: string;
  lists: ListExportEntry[];
}

export interface AppState {
  /** Game-seed lists (the hideout workbenches), read-only — never persisted. */
  workbenches: List[];
  /** User-created lists (per-profile), persisted. Kept separate from the game seed. */
  customLists: List[];
  itemsInfo: Record<string, ItemInfo>;

  hideoutLevels: Record<string, number>;
  targetLevels: Record<string, number>;
  activeModules: Record<string, boolean>;
  inventory: Record<string, number>;
  filterHideCompleted: boolean;
  listOrder: string[];

  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  setItemCount: (itemId: string, val: number) => void;
  setModuleCurrentLevel: (moduleId: string, level: number, deductMaterials?: boolean) => void;
  setModuleTargetLevel: (moduleId: string, level: number) => void;
  toggleModuleActive: (moduleId: string) => void;
  setFilterHideCompleted: (val: boolean) => void;
  upgradeModule: (moduleId: string) => void;
  setListOrder: (order: string[]) => void;
  resetProgress: () => void;

  /** Create a user list; returns its namespaced id (`custom:<uuid>`). */
  createCustomList: (data: { name: string; levels: ListLevel[]; listType?: ListType }) => string;
  updateCustomList: (id: string, patch: Partial<{ name: string; levels: ListLevel[]; listType: ListType }>) => void;
  deleteCustomList: (id: string) => void;
  /** Import lists from an export file, overwriting any existing list with the same id. */
  importCustomLists: (data: ListExportFile) => void;

  /** Game seed + custom lists, the set every selector operates on. */
  getAllLists: () => List[];
  getOrderedLists: () => List[];
  /** Total materials required by active goals; pass a moduleId to exclude that bench's needs. */
  getTotalRequiredMaterials: (excludeModuleId?: string) => Record<string, number>;
  getMissingMaterials: () => Array<{
    itemId: string;
    owned: number;
    required: number;
    missing: number;
    isCompleted: boolean;
  }>;
  getAvailableUpgrades: () => string[];
}
