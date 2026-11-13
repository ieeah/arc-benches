import type { AppLanguage } from '@/i18n/types';
import type { MacroSectionId, SectionId } from './sections';
import type { ItemInfo } from './items';
import type {
  ActionStep,
  CompletedRewardPass,
  ExpeditionList,
  List,
  ListLevel,
  PassList,
  RewardPassLevelResult,
} from './lists';
import type {
  ListExportFile,
  MultiProfileExportFile,
  Profile,
  ProfileExportEntry,
} from './export';
import type { PersonalityProfile } from './personality';
import type { RaidPlanState } from './raid';

export type { AppLanguage };

export type AppTheme = 'light' | 'dark';
export type NavSide = 'left' | 'right';
export type NavVariant = 'classic' | 'morphing';
export type ReducedMotion = 'auto' | 'reduce' | 'normal';
export type StashViewMode = 'grid' | 'list';
export type StashGridDensity = 'comfortable' | 'compact';
export type CraftMode = 'strict' | 'level-only';
export type StashPriorityMode = 'list-first' | 'level-first';

export type AppState = {
  /** Game-seed lists (the hideout workbenches), read-only — never persisted. */
  workbenches: List[];
  /** Game-seed project lists (`listType: 'project'`), read-only — never persisted. */
  projects: List[];
  /** User-created lists for the active profile only (persisted per-profile). */
  customLists: List[];
  /** User-created lists shared across all profiles (persisted globally). */
  sharedCustomLists: List[];
  itemsInfo: Record<string, ItemInfo>;

  profiles: Profile[];
  activeProfileId: string;

  currentLevels: Record<string, number>;
  /** Levels selected as objectives, per list. A level is tracked only if selected AND > current. */
  targetLevels: Record<string, number[]>;
  activeModules: Record<string, boolean>;
  /** Moduli e sezioni attive per il profilo (#102) */
  enabledSections: Record<string, boolean>;
  setSectionEnabled: (sectionId: SectionId, enabled: boolean) => void;
  setMacroSectionWithChildren: (macroId: MacroSectionId, enabled: boolean) => void;
  resetSectionsToDefault: () => void;
  inventory: Record<string, number>;
  filterHideCompleted: boolean;
  listOrder: string[];

  /** Global Settings */
  language: AppLanguage;
  navSide: NavSide;
  navVariant: NavVariant;
  reducedMotion: ReducedMotion;
  radialMenuEnabled: boolean;
  quickFavorites: [string, string];
  mainProfileId: string;
  startupProfileOption: string;
  theme: AppTheme;
  stashViewMode: StashViewMode;
  stashGridDensity: StashGridDensity;
  craftMode: CraftMode;
  stashPriorityMode: StashPriorityMode;
  setLanguage: (lang: AppLanguage) => void;
  setNavSide: (side: NavSide) => void;
  setNavVariant: (variant: NavVariant) => void;
  setReducedMotion: (mode: ReducedMotion) => void;
  setRadialMenuEnabled: (enabled: boolean) => void;
  setQuickFavorites: (favorites: [string, string]) => void;
  setMainProfileId: (id: string) => void;
  setStartupProfileOption: (option: string) => void;
  setTheme: (theme: AppTheme) => void;
  setStashViewMode: (mode: StashViewMode) => void;
  setStashGridDensity: (density: StashGridDensity) => void;
  setCraftMode: (mode: CraftMode) => void;
  setStashPriorityMode: (mode: StashPriorityMode) => void;

  /** Active Role Maker personality for the active profile */
  activePersonalityId: string | null;
  rollPersonality: () => PersonalityProfile;
  clearPersonality: () => void;

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

  /** Create a user list; returns its namespaced id (`custom:<uuid>`). Always 'custom' listType. */
  createCustomList: (data: { name: string; levels: ListLevel[]; shared?: boolean; expirationDate?: string; extractionWiped?: boolean }) => string;
  updateCustomList: (id: string, patch: Partial<{ name: string; levels: ListLevel[]; expirationDate?: string; extractionWiped?: boolean }>) => void;
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
  setLevelActionsBatch: (listId: string, level: number, actionIds: string[], checked: boolean) => void;
  setTieredActionStep: (listId: string, level: number, tieredActionId: string, steps: ActionStep[], stepIndex: number) => void;

  /** Expeditions & Prestige State for active profile */
  expeditions: ExpeditionList[];
  completedExpeditionsCount: number;
  earnedPermanentSkillPoints: number;
  consecutiveStreak: number;
  departureWindowActive: boolean;
  setExpeditionProfile: (partial: Partial<{ completedExpeditionsCount: number; earnedPermanentSkillPoints: number; consecutiveStreak: number; departureWindowActive: boolean }>) => void;
  setDepartureWindowActive: (active: boolean) => void;
  confirmDeparture: (gainOverride?: number) => void;
  closeWindowWithoutDeparture: (clearInventory?: boolean) => void;

  /** Reward Pass (seed read-only, `listType: 'pass'`) */
  passes: PassList[];
  /** Id del pass attivo del profilo: al massimo uno alla volta, cambiabile in qualsiasi momento; il livello di ogni pass resta in `currentLevels`. */
  activeRewardPass: string | null;
  /** Archivio per profilo dei pass completati (livello massimo raggiunto). */
  completedRewardPasses: CompletedRewardPass[];
  /**
   * Rende attivo un pass (`null` = nessuno). Il livello del pass si conserva; `startLevel` lo imposta (0..maxLevel-1).
   * Un pass completato riparte da maxLevel - 1 (chi chiama chiede prima conferma). Rifiutato (false) se il pass non esiste o non è attivo nel gioco.
   */
  setActiveRewardPass: (passId: string | null, startLevel?: number) => boolean;
  /** Imposta il livello raggiunto di un pass (default: l'attivo), limitato a 0..maxLevel. Il livello massimo lo completa. */
  setRewardPassLevel: (level: number, passId?: string) => RewardPassLevelResult;
  /** Completa il pass attivo: livello massimo (stesso effetto di `setRewardPassLevel(maxLevel)`). */
  concludeRewardPass: () => RewardPassLevelResult;
  /** Azzera i progressi di un pass: livello e voce nell'archivio dei completati. */
  resetRewardPassProgress: (passId: string) => void;
  /** Il pass attivo non è più disponibile (tolto dal gioco): dopo l'avviso all'utente lo si toglie, il livello resta. */
  acknowledgeInactiveRewardPass: () => void;

  /** Blueprint Tracker state for the active profile */
  ownedBlueprints: Record<string, boolean>;
  filterHideOwnedBlueprints: boolean;
  toggleBlueprintOwned: (id: string) => void;
  setBlueprintOwned: (id: string, owned: boolean) => void;
  setFilterHideOwnedBlueprints: (hide: boolean) => void;
  syncItemsOverrides?: () => void;

  /** Raid Plan state for the active profile (#117) */
  raidPlan: RaidPlanState;
  setIsRaidRunning: (isRunning: boolean) => void;
  addRaidAction: (text: string) => void;
  toggleRaidAction: (id: string) => void;
  removeRaidAction: (id: string) => void;
  addRaidItem: (itemId: string, targetQuantity?: number) => void;
  updateRaidItemFound: (id: string, delta: number) => void;
  setRaidItemFoundQuantity: (id: string, quantity: number) => void;
  setRaidItemFoundAll: (id: string) => void;
  updateRaidItemTarget: (id: string, targetQuantity: number) => void;
  replaceRaidItem: (id: string, newItemId: string) => void;
  removeRaidItem: (id: string) => void;
  applyRaidPlanToStash: () => { addedItemsCount: number; remainingItemsCount: number };
  resetRaidPlanProgress: () => void;
  clearRaidPlan: () => void;
  setRaidPreferredViewMode: (viewMode: 'grid' | 'list') => void;

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
  getMissingActions: () => import('@/store/selectors').MissingAction[];
  getAvailableUpgrades: () => string[];
};
