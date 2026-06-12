export interface ItemRequirement {
  itemId: string;
  quantity: number;
}

export interface WorkbenchLevel {
  level: number;
  requirementItemIds: ItemRequirement[];
}

export interface Workbench {
  id: string;
  name: string;
  maxLevel: number;
  levels: WorkbenchLevel[];
}

export interface ItemInfo {
  id: string;
  name: string;
  description: string;
  icon: string | null; // local path relative to BASE_URL (e.g. "icons/items/lemon.webp")
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | string;
  item_type: string;
  subcategory: string;
  value: number;
  workbench: string | null;
  loot_area: string | null;
}

export interface AppState {
  workbenches: Workbench[];
  itemsInfo: Record<string, ItemInfo>;

  hideoutLevels: Record<string, number>;
  targetLevels: Record<string, number>;
  activeModules: Record<string, boolean>;
  inventory: Record<string, number>;
  filterHideCompleted: boolean;
  workbenchOrder: string[];

  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  setItemCount: (itemId: string, val: number) => void;
  setModuleCurrentLevel: (moduleId: string, level: number, deductMaterials?: boolean) => void;
  setModuleTargetLevel: (moduleId: string, level: number) => void;
  toggleModuleActive: (moduleId: string) => void;
  setFilterHideCompleted: (val: boolean) => void;
  upgradeModule: (moduleId: string) => void;
  setWorkbenchOrder: (order: string[]) => void;
  resetProgress: () => void;

  getOrderedWorkbenches: () => Workbench[];
  getTotalRequiredMaterials: () => Record<string, number>;
  getMissingMaterials: () => Array<{
    itemId: string;
    owned: number;
    required: number;
    missing: number;
    isCompleted: boolean;
  }>;
  getAvailableUpgrades: () => string[];
}
