/** A reward is always a catalog item (currencies such as coins, XP and Reward Points are items too). */
export type Reward = {
  itemId: string;
  quantity: number;
  /** Solo nei livelli di un Reward Pass: id della traccia (vedi `PassList.tracks`). La validazione rende esplicita la prima traccia quando manca. */
  track?: string;
};

export type ItemRequirement = {
  itemId: string;
  quantity: number;
  rewards?: Reward[];
};

export type ActionTranslation = {
  label?: string;
};

/** Oggetto da avere con sé quando si compie l'azione: non è un requisito di consegna e non entra nel fabbisogno. */
export type CarryItem = {
  itemId: string;
  quantity: number;
};

/** Vincoli di contesto di un'azione o di uno step. */
export type ActionContext = {
  /** Id delle mappe (catalogo in `src/data/maps.json`) in cui va compiuta; assente = ovunque. */
  maps?: string[];
  /** Oggetti da portare in mappa al momento del compimento. */
  carryItems?: CarryItem[];
};

export type CheckboxAction = ActionContext & {
  id: string;   // crypto.randomUUID() — stable key, never changes after creation
  label: string;
  translations?: Record<string, ActionTranslation>;
  rewards?: Reward[];
};

export type ActionStep = ActionContext & {
  id: string;   // stable step identifier
  label: string;
  translations?: Record<string, ActionTranslation>;
  rewards?: Reward[];
};

export type TieredAction = {
  id: string;   // crypto.randomUUID() — stable key, never changes after creation
  label: string;
  translations?: Record<string, ActionTranslation>;
  steps: ActionStep[];
};

/**
 * Requisito di un livello su un'altra lista: per sbloccarlo, la lista indicata deve essere almeno a quel livello
 * (es. Research Station Lvl 2 richiede Outpost Lvl 2). È una condizione derivata, non un'azione da spuntare.
 */
export type LevelRequirement = {
  listId: string;
  level: number;
};

export type ListLevel = {
  level: number;
  requirementItemIds: ItemRequirement[];
  /** Requisiti di livello su altre liste: finché non sono soddisfatti il livello non si può raggiungere (#87). */
  requires?: LevelRequirement[];
  actions?: CheckboxAction[];
  tieredActions?: TieredAction[];
  rewards?: Reward[];
};

/** Semantic category of a list, orthogonal to `custom` (a custom list may also be a project, etc.). */
export type ListType = 'workbench' | 'project' | 'quest' | 'custom' | 'expedition' | 'pass';

export type ListTranslation = {
  name?: string;
  description?: string;
};

/** Fields shared by every kind of list. */
export type ListBase = {
  id: string;
  name: string;
  description?: string;
  translations?: Record<string, ListTranslation>;
  maxLevel: number;
  levels: ListLevel[];
  /** true = user-created (persisted); absent/false = game seed (read-only). */
  custom?: boolean;
  /** true = shared across all profiles; false/absent = profile-specific. Immutable after creation. */
  shared?: boolean;
  /** Data e ora di inizio/apertura finestra ISO 8601 (es. "2026-09-10T18:00:00+02:00"). Opzionale; non usata dai banchi. */
  startDate?: string;
  /** Data e ora di scadenza/partenza ISO 8601 (es. "2026-09-30T20:00:00+02:00"). Opzionale; non usata dai banchi. */
  expirationDate?: string;
  /** IDs (es. ARDB) delle liste/quest/azioni da completare prima che questa si sblocchi. Opzionale su ogni tipo di lista. */
  prerequisites?: string[];
  /** true = la progressione di questa lista viene azzerata dal wipe post-estrazione/prestigio; false/assente = permanente nel rifugio. */
  extractionWiped?: boolean;
};

/** Game hideout bench (read-only seed). */
export type WorkbenchList = ListBase & {
  listType: 'workbench';
};

/** Sequential caravan (Expeditions 1, 2, 3...). */
export type ExpeditionList = ListBase & {
  listType: 'expedition';
  /** Index for sequential progression (Expeditions 1, 2, 3...). */
  expeditionIndex: number;
  /** Custom damage challenge thresholds specific to this expedition. */
  damageChallenge?: TieredAction;
};

/** Game project (read-only seed). */
export type ProjectList = ListBase & {
  listType: 'project';
};

/** Trader quest. */
export type QuestList = ListBase & {
  listType: 'quest';
  /** Trader that gives this quest. Matches ARDB trader id (e.g. "shani", "apollo"). */
  trader?: string;
};

/** Una traccia di un Reward Pass (es. free, premium, legacy): è un dato, non un'enumerazione fissa. */
export type PassTrackDef = {
  /** Id in hyphen-case, referenziato da `Reward.track`. */
  id: string;
  name: string;
  translations?: Record<string, { name?: string }>;
  /** Traccia a pagamento: come nel gioco, le sue ricompense mostrano il lucchetto finché non è sbloccata. */
  locked?: boolean;
};

/** Reward Pass: i livelli sono i tier e le ricompense di ogni livello appartengono a una traccia. */
export type PassList = ListBase & {
  listType: 'pass';
  /** Tracce del pass, nell'ordine di visualizzazione. */
  tracks: PassTrackDef[];
  /** Costo della traccia premium in Raider Token (solo informativo). */
  premiumCostTokens?: number;
  /**
   * Pass presente nel gioco. `false` = tolto dal gioco: nascosto all'app ma conservato nel file come archivio
   * (e per le pagine trofei). Assente = `true`. Si cambia solo da Gestione Liste (Dev).
   */
  active?: boolean;
};

/** User-created list (persisted). */
export type CustomList = ListBase & {
  listType: 'custom';
  custom: true;
};

/**
 * A tracked list of materials by level — the generic engine, as a discriminated union on `listType`:
 * the game's hideout workbenches are the read-only seed; custom lists are user-created instances.
 */
export type List = WorkbenchList | ExpeditionList | ProjectList | QuestList | PassList | CustomList;

/** Un Reward Pass completato dal profilo: l'archivio per profilo (e per la futura pagina dei trofei); il nome si legge da `passes.json`. */
export type CompletedRewardPass = {
  id: string;
  /** Data di completamento, ISO 8601. */
  completedAt: string;
};

/** Esito di un cambio di livello di un pass: se l'ha completato e, se era il pass attivo, quali pass proporre al suo posto. */
export type RewardPassLevelResult = {
  completed: boolean;
  /** Pass tra cui scegliere quello da attivare (più di uno); vuoto se se ne è attivato uno da solo o non ce ne sono. */
  choices: string[];
};
