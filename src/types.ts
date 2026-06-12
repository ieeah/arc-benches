export interface LocalizedNames {
  [key: string]: string;
  en: string;
  it: string;
}

export interface ItemRequirement {
  itemId: string;
  quantity: number;
}

export interface HideoutModuleLevel {
  level: number;
  description?: string;
  requirementItemIds: ItemRequirement[];
  otherRequirements?: string[];
}

export interface HideoutModule {
  id: string;
  name: LocalizedNames;
  maxLevel: number;
  levels: HideoutModuleLevel[];
}

export interface ItemInfo {
  id: string;
  name: string; // MetaForge uses a single string for name
  rarity: string;
  icon: string;
}

export interface HideoutResponse {
  items: HideoutModule[];
}

export interface ItemsResponse {
  data: ItemInfo[];
}

// App State Types
export interface AppState {
  // Data from API
  modules: HideoutModule[];
  itemsInfo: Record<string, ItemInfo>;
  
  // User Progress
  hideoutLevels: Record<string, number>; // moduleId -> currentLevel
  targetLevels: Record<string, number>; // moduleId -> targetLevel
  activeModules: Record<string, boolean>; // moduleId -> isActive
  inventory: Record<string, number>; // itemId -> quantity
  
  // Settings
  filterHideCompleted: boolean;
  
  // Actions
  setModules: (modules: HideoutModule[]) => void;
  setItemsInfo: (items: ItemInfo[]) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  setItemCount: (itemId: string, val: number) => void;
  setModuleCurrentLevel: (moduleId: string, level: number) => void;
  setModuleTargetLevel: (moduleId: string, level: number) => void;
  toggleModuleActive: (moduleId: string) => void;
  setFilterHideCompleted: (val: boolean) => void;
  upgradeModule: (moduleId: string) => void;
  
  // Selectors (Calculated fields)
  getTotalRequiredMaterials: () => Record<string, number>;
  getMissingMaterials: () => Array<{ 
    itemId: string; 
    owned: number; 
    required: number; 
    missing: number;
    isCompleted: boolean;
  }>;
  getAvailableUpgrades: () => string[]; // List of moduleIds
}
