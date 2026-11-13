export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | string;

export type CraftStatus = 'craftable' | 'needs_level' | 'needs_project' | 'not_craftable';

export type CraftInfo = {
  workbenchId: string;
  levelRequired: number;
  recipeId?: string | null;
};

export type ItemTranslation = {
  name?: string;
  description?: string;
};

export type ItemInfo = {
  id: string;
  name: string; // Default / English
  description: string; // Default / English
  translations?: Record<string, ItemTranslation>; // e.g. { it: { name: "...", description: "..." } }
  icon: string | null; // local path relative to BASE_URL (e.g. "icons/items/lemon.webp")
  rarity: ItemRarity;
  item_type: string;
  subcategory: string | null;
  value: number | null;
  workbench: string | null;
  loot_area: string | null;
  stack_size: number | null;
  hidden?: boolean;
  /** Se deprecato, l'oggetto rimane nel catalogo ma è escluso dall'ItemPicker per requisiti/azioni. */
  deprecated?: boolean;
  /** Se l'oggetto non ha un'icona propria, usa quella di questo altro oggetto (es. i pezzi di un outfit usano l'immagine dell'outfit di base). */
  iconFromItem?: string;
  /** ID del banco di lavoro strutturato (es. "refiner", "weapon-bench", "med-station"). Derivato o da override. */
  craft_workbench_id?: string | null;
  /** Livello richiesto del banco. */
  craft_level_required?: number | null;
  /** ID dell'oggetto blueprint / recipe richiesto (opzionale). */
  craft_recipe_id?: string | null;
};
