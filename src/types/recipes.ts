/**
 * Tipi per la fabbricazione, potenziamento, riparazione e riciclo degli oggetti.
 * Conformità: tassativamente type (mai interface).
 */

export type StationRequirement = {
  /** Livello minimo richiesto per il banco del rifugio con progressione (1, 2, 3) */
  levelRequired?: number;
  /** ID dell'abilità dello Skill Tree richiesta (es. 'surv_3r' per in-raid, 'surv_5c' per le trappole) */
  skillRequired?: string;
};

export type CraftingRecipe = {
  /** Mappa delle stazioni/ambienti abilitati con i rispettivi requisiti individuali */
  benches: Record<string, StationRequirement>;
  /** Indica se è richiesto l'apprendimento del relativo Blueprint */
  blueprintRequired: boolean;
  /** Quantità di oggetti prodotti per singolo craft (default 1) */
  craftQuantity: number;
  /** Mappa degli ingredienti necessari { [itemId: string]: quantità } */
  ingredients: Record<string, number>;
};

export type UpgradeRequirement = 
  | { type: 'station'; station: string; level: number }
  | { type: 'research'; itemId: string }
  | { type: 'item'; itemId: string };

export type UpgradeBranch = {
  to: string;
  cost: Record<string, number>;
  requires?: UpgradeRequirement[];
};

export type UpgradeInfo = {
  upgradeCost?: Record<string, number>;
  upgradesTo?: string;
  branches?: UpgradeBranch[];
};

export type RepairInfo = {
  cost: Record<string, number>;
  durabilityRestored: number;
};

export type RecyclingInfo = {
  recyclesInto?: Record<string, number>;
  salvagesInto?: Record<string, number>;
};

export type ItemRecipeData = {
  itemId: string;
  crafting?: CraftingRecipe;
  upgrade?: UpgradeInfo;
  repair?: RepairInfo;
  recycling?: RecyclingInfo;
};

export type RecipesCatalog = {
  version: string;
  generatedAt: string;
  totalCraftable: number;
  totalUpgradable: number;
  totalRepairable: number;
  totalRecyclable: number;
  recipes: Record<string, ItemRecipeData>;
};
