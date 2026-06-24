export interface ItemRequirement {
  itemId: string;
  quantity: number;
}

export interface CheckboxAction {
  id: string;   // crypto.randomUUID() — stable key, never changes after creation
  label: string;
}

export interface ListLevel {
  level: number;
  requirementItemIds: ItemRequirement[];
  actions?: CheckboxAction[];
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
  /** true = user-created (persisted); absent/false = game seed (read-only). */
  custom?: boolean;
  /** Category for labels/icons/grouping; defaults to 'workbench' for game seed. */
  listType?: ListType;
  /** true = shared across all profiles; false/absent = profile-specific. Immutable after creation. */
  shared?: boolean;
}

export interface Profile {
  id: string;
  name: string;
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
  /** Levels selected as objectives (canonical v2 shape). v1 files migrate `targetLevel` → this. */
  targetLevels: number[];
  active: boolean;
}

export interface ListExportFile {
  /** 1 = legacy single-ceiling target; 2 = per-level target set. Both accepted on import. */
  version: 1 | 2;
  exportedAt: string;
  lists: ListExportEntry[];
  /** Snapshot of the user's inventory quantities at export time. */
  inventory?: Record<string, number>;
}

/** State snapshot for one profile inside a v3 multi-profile export. */
export interface ProfileExportEntry {
  profile: Profile;
  lists: ListExportEntry[];
  inventory: Record<string, number>;
}

/** Version 3 export: always multi-profile, even when exporting a single profile. */
export interface MultiProfileExportFile {
  version: 3;
  exportedAt: string;
  /** Shared custom list definitions (cross-profile; state lives inside each ProfileExportEntry). */
  sharedLists: List[];
  profiles: ProfileExportEntry[];
}

export interface AppState {
  /** Game-seed lists (the hideout workbenches), read-only — never persisted. */
  workbenches: List[];
  /** User-created lists for the active profile only (persisted per-profile). */
  customLists: List[];
  /** User-created lists shared across all profiles (persisted globally). */
  sharedCustomLists: List[];
  itemsInfo: Record<string, ItemInfo>;

  profiles: Profile[];
  activeProfileId: string;

  hideoutLevels: Record<string, number>;
  /** Levels selected as objectives, per list. A level is tracked only if selected AND > current. */
  targetLevels: Record<string, number[]>;
  activeModules: Record<string, boolean>;
  inventory: Record<string, number>;
  filterHideCompleted: boolean;
  listOrder: string[];

  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  setItemCount: (itemId: string, val: number) => void;
  setModuleCurrentLevel: (moduleId: string, level: number, deductMaterials?: boolean) => void;
  /** Add/remove a level from a list's objective set. */
  toggleTargetLevel: (moduleId: string, level: number) => void;
  toggleModuleActive: (moduleId: string) => void;
  setFilterHideCompleted: (val: boolean) => void;
  upgradeModule: (moduleId: string) => void;
  setListOrder: (order: string[]) => void;
  resetProgress: () => void;

  /** Create a user list; returns its namespaced id (`custom:<uuid>`). */
  createCustomList: (data: { name: string; levels: ListLevel[]; listType?: ListType; shared?: boolean }) => string;
  updateCustomList: (id: string, patch: Partial<{ name: string; levels: ListLevel[]; listType: ListType }>) => void;
  deleteCustomList: (id: string) => void;
  /** Import lists from a v2 export file. Custom lists: merge definition + state. Game lists: state only. */
  importLists: (data: ListExportFile) => void;
  /** Import selected profiles from a v3 multi-profile export file. */
  importMultiProfile: (data: MultiProfileExportFile, selectedProfileIds: string[]) => void;
  /** Build export payloads for the given profile IDs (reads localStorage for non-active profiles). */
  buildExportData: (profileIds: string[]) => { sharedLists: List[]; profiles: ProfileExportEntry[] };

  /** Checkbox actions completion — key: `${listId}|${level}|${actionId}` */
  checkedActions: Record<string, boolean>;
  toggleAction: (listId: string, level: number, actionId: string) => void;

  createProfile: (name: string) => void;
  switchProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;

  /** Game seed + shared custom lists + active-profile custom lists; the set every selector operates on. */
  getAllLists: () => List[];
  getOrderedLists: () => List[];
  /** Current level of the Refiner workbench (drives the craftable-now badges). */
  getRefinerLevel: () => number;
  /** Ordered lists split by completion (current level vs maxLevel). */
  getActiveLists: () => List[];
  getMaxedLists: () => List[];
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
