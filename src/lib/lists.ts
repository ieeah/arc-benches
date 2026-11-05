import type { CustomList, ExpeditionList, LevelRequirement, List, ListLevel, ListType, PassList, PassTrackDef, ProjectList, QuestList, WorkbenchList } from '@/types';

/**
 * The "base" level a list starts from. A list whose level 1 has no requirements is already
 * unlocked from the start (e.g. Scrappy) → level 0 doesn't exist for it; otherwise it starts at 0.
 */
export const getBaseLevel = (list: List): number => {
  const first = list.levels.find(l => l.level === 1);
  // Con un requisito su un'altra lista (es. Outpost Lvl 1) il livello 1 non è «già sbloccato».
  return first?.requirementItemIds.length === 0 && !first.requires?.length ? 1 : 0;
};

// Type guard per restringere la union `List` sul tipo di lista (`listType`).
export const isWorkbench = (l: List): l is WorkbenchList => l.listType === 'workbench';
export const isExpedition = (l: List): l is ExpeditionList => l.listType === 'expedition';
export const isProject = (l: List): l is ProjectList => l.listType === 'project';
export const isQuest = (l: List): l is QuestList => l.listType === 'quest';
export const isPass = (l: List): l is PassList => l.listType === 'pass';
export const isCustom = (l: List): l is CustomList => l.listType === 'custom';

/** Tracce di partenza di un nuovo Reward Pass. */
export const DEFAULT_PASS_TRACKS: readonly PassTrackDef[] = [
  { id: 'free', name: 'Free', translations: { it: { name: 'Gratuita' } } },
  { id: 'premium', name: 'Premium', translations: { it: { name: 'Premium' } }, locked: true },
];

/**
 * Converte una lista a un altro tipo, scartando i campi specifici del tipo di partenza e
 * aggiungendo quelli obbligatori del tipo di arrivo (`expeditionIndex` per le spedizioni).
 */
export function withListType(list: List, listType: ListType, expeditionIndex = 1): List {
  const { id, name, description, translations, maxLevel, levels, shared, startDate, expirationDate, prerequisites, extractionWiped } = list;
  const base = { id, name, description, translations, maxLevel, levels, shared, startDate, expirationDate, prerequisites, extractionWiped };
  switch (listType) {
    case 'expedition':
      return {
        ...base,
        listType,
        expeditionIndex: isExpedition(list) ? list.expeditionIndex : expeditionIndex,
        damageChallenge: isExpedition(list) ? list.damageChallenge : undefined,
      };
    case 'quest':
      return { ...base, listType, trader: isQuest(list) ? list.trader : undefined };
    case 'pass':
      return {
        ...base,
        listType,
        tracks: isPass(list) ? list.tracks : DEFAULT_PASS_TRACKS.map((t) => ({ ...t })),
        premiumCostTokens: isPass(list) ? list.premiumCostTokens : undefined,
        active: isPass(list) ? list.active : undefined,
      };
    case 'custom':
      return { ...base, listType, custom: true };
    default:
      return { ...base, listType };
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Finestra delle azioni (#111): l'azione del livello N si fa quando il livello corrente è N-1, né prima né dopo.
// Chiave in `checkedActions`: `listId|livello|azione` (`azione` = id, `tieredId:stepId` o `item_<oggetto>`).
// ---------------------------------------------------------------------------------------------------------------

/** Livello le cui azioni valgono adesso: quello successivo al corrente. */
export const actionWindowLevel = (current: number): number => current + 1;

/** `true` se le azioni del livello indicato valgono con il livello corrente dato. */
export const isActionWindowOpen = (level: number, current: number): boolean => level === actionWindowLevel(current);

/** Livello corrente di una lista: quello salvato, o il livello di partenza della lista. */
export const currentLevelOf = (list: List, currentLevels: Record<string, number>): number =>
  currentLevels[list.id] ?? getBaseLevel(list);

/** Livello e lista di una chiave di `checkedActions` (`listId|livello|azione`); `null` se la forma non è questa. */
export function parseActionKey(key: string): { listId: string; level: number } | null {
  const [listId, levelPart, ...rest] = key.split('|');
  const level = Number(levelPart);
  if (!listId || rest.length === 0 || !Number.isInteger(level)) return null;
  return { listId, level };
}

/**
 * Toglie le spunte di azioni di livelli oltre la finestra (fatte troppo presto: non valgono né si conservano).
 * Restano quelle dei livelli già superati e quelle di chiavi che non appartengono a una lista nota
 * (es. la sfida danni e il recupero PS delle spedizioni).
 */
export function pruneOutOfWindowChecks(
  checked: Record<string, boolean>,
  lists: List[],
  currentLevels: Record<string, number>,
): Record<string, boolean> {
  const byId = new Map(lists.map((l) => [l.id, l]));
  const out: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(checked)) {
    const parsed = parseActionKey(key);
    const list = parsed ? byId.get(parsed.listId) : undefined;
    if (parsed && list && parsed.level > actionWindowLevel(currentLevelOf(list, currentLevels))) continue;
    out[key] = value;
  }
  return out;
}

/** Tutte le chiavi di `checkedActions` di un livello di una lista: azioni, passi delle azioni a livelli e consegne di oggetti. */
export function levelActionKeys(list: List, level: number): string[] {
  const lvl = list.levels.find((l) => l.level === level);
  if (!lvl) return [];
  return [
    ...(lvl.actions ?? []).map((a) => `${list.id}|${level}|${a.id}`),
    ...(lvl.tieredActions ?? []).flatMap((t) => (t.steps ?? []).map((st) => `${list.id}|${level}|${t.id}:${st.id}`)),
    ...lvl.requirementItemIds.map((r) => `${list.id}|${level}|item_${r.itemId}`),
  ];
}

/**
 * Salendo di livello i materiali dei livelli superati si considerano consegnati e si sottraggono dall'inventario;
 * c'è un conflitto se uno di quegli oggetti, che l'utente possiede, serve anche ad altre liste (`otherNeeds`).
 */
export function hasDeductionConflict(
  list: List,
  current: number,
  level: number,
  inventory: Record<string, number>,
  otherNeeds: Record<string, number>,
): boolean {
  return list.levels.some(
    l => l.level > current && l.level <= level &&
      l.requirementItemIds.some(req => (inventory[req.itemId] ?? 0) > 0 && (otherNeeds[req.itemId] ?? 0) > 0),
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Requisiti tra liste (#87): un livello può richiedere che un'altra lista sia almeno a un certo livello.
// Il vincolo è a senso unico: la lista richiesta (es. Outpost) può salire senza quella che la richiede.
// ---------------------------------------------------------------------------------------------------------------

/** Requisiti del livello non ancora soddisfatti dai livelli correnti. */
export function unmetRequirements(level: ListLevel | undefined, currentLevels: Record<string, number>): LevelRequirement[] {
  return (level?.requires ?? []).filter(req => (currentLevels[req.listId] ?? 0) < req.level);
}

/**
 * Livello più alto raggiungibile adesso: sotto il primo livello (oltre al corrente) con un requisito non soddisfatto.
 * Senza requisiti bloccanti è `maxLevel`.
 */
export function maxReachableLevel(list: List, currentLevels: Record<string, number>): number {
  const current = currentLevelOf(list, currentLevels);
  const blocked = [...list.levels]
    .sort((a, b) => a.level - b.level)
    .find(l => l.level > current && unmetRequirements(l, currentLevels).length > 0);
  return blocked ? Math.max(current, blocked.level - 1) : list.maxLevel;
}

export interface CascadeStep {
  listId: string;
  /** Livello corrente della lista dipendente e quello a cui dovrebbe scendere. */
  from: number;
  to: number;
}

/**
 * Portando `listId` a `newLevel` (più basso), le liste i cui livelli già raggiunti lo richiedono a un livello
 * più alto scendono al livello appena sotto il primo violato; a catena (Sheltered Retreat → Outpost → Research
 * Station). Il livello di `listId` non è incluso nel risultato.
 */
export function getCascadeLowering(
  lists: List[],
  currentLevels: Record<string, number>,
  listId: string,
  newLevel: number,
): CascadeStep[] {
  const levels = { ...currentLevels, [listId]: newLevel };
  const steps = new Map<string, CascadeStep>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const list of lists) {
      if (list.id === listId) continue;
      const current = levels[list.id] ?? getBaseLevel(list);
      const violated = list.levels
        .filter(l => l.level <= current && unmetRequirements(l, levels).length > 0)
        .map(l => l.level);
      if (violated.length === 0) continue;
      const to = Math.min(...violated) - 1;
      levels[list.id] = to;
      const from = steps.get(list.id)?.from ?? current;
      steps.set(list.id, { listId: list.id, from, to });
      changed = true;
    }
  }
  return [...steps.values()];
}

export type ListProgressSegment = {
  level: number;
  status: 'completed' | 'in-progress' | 'future' | 'ready';
  percent: number;
  /** True se corrisponde esattamente al livello target successivo a quello corrente (livello attivo) */
  isTarget?: boolean;
};

export type ListProgress = {
  baseLevel: number;
  maxLevel: number;
  currentLevel: number;
  isMaxed: boolean;
  canUpgrade: boolean;
  overallPercent: number;
  nextLevelPercent: number;
  segments: ListProgressSegment[];
};

/**
 * Calcola la percentuale di completamento dei requisiti (materiali e azioni) per un livello specifico.
 */
export function calculateLevelRequirementsPercent(
  list: List,
  levelNum: number,
  inventory: Record<string, number> = {},
  checkedActions?: Record<string, boolean>,
): number {
  const levelData = list.levels.find(l => l.level === levelNum);
  if (!levelData) return 0;

  const reqItems = levelData.requirementItemIds ?? [];
  let hasMaterials = false;
  let materialFraction = 0;

  if (reqItems.length > 0) {
    let totalRequired = 0;
    let totalOwned = 0;
    for (const req of reqItems) {
      totalRequired += req.quantity;
      const isDelivered = checkedActions?.[`${list.id}|${levelNum}|item_${req.itemId}`];
      const owned = isDelivered ? req.quantity : (inventory[req.itemId] ?? 0);
      totalOwned += Math.min(req.quantity, Math.max(0, owned));
    }
    hasMaterials = true;
    materialFraction = totalRequired > 0 ? totalOwned / totalRequired : 1;
  }

  const actions = levelData.actions ?? [];
  const tieredActions = levelData.tieredActions ?? [];
  let totalActions = actions.length;
  for (const t of tieredActions) {
    totalActions += (t.steps ?? []).length;
  }

  let hasActions = false;
  let actionFraction = 0;

  if (totalActions > 0) {
    let completedActions = 0;
    for (const a of actions) {
      if (checkedActions?.[`${list.id}|${levelNum}|${a.id}`]) completedActions++;
    }
    for (const t of tieredActions) {
      for (const s of t.steps ?? []) {
        if (checkedActions?.[`${list.id}|${levelNum}|${t.id}:${s.id}`]) completedActions++;
      }
    }
    hasActions = true;
    actionFraction = completedActions / totalActions;
  }

  if (hasMaterials && hasActions) {
    return Math.min(100, Math.max(0, Math.round(((materialFraction + actionFraction) / 2) * 100)));
  } else if (hasMaterials) {
    return Math.min(100, Math.max(0, Math.round(materialFraction * 100)));
  } else if (hasActions) {
    return Math.min(100, Math.max(0, Math.round(actionFraction * 100)));
  }
  return 0;
}

export function calculateListProgress(
  list: List,
  current: number,
  inventory: Record<string, number> = {},
  checkedActions?: Record<string, boolean>,
  canUpgrade: boolean = false,
): ListProgress {
  const baseLevel = getBaseLevel(list);
  const maxLevel = list.maxLevel;
  const isMaxed = current >= maxLevel;
  const totalLevels = Math.max(1, maxLevel - baseLevel);

  if (isMaxed) {
    const segments: ListProgressSegment[] = [];
    for (let lvl = baseLevel + 1; lvl <= maxLevel; lvl++) {
      segments.push({ level: lvl, status: 'completed', percent: 100, isTarget: false });
    }
    if (segments.length === 0) {
      segments.push({ level: maxLevel, status: 'completed', percent: 100, isTarget: false });
    }
    return {
      baseLevel,
      maxLevel,
      currentLevel: current,
      isMaxed: true,
      canUpgrade: false,
      overallPercent: 100,
      nextLevelPercent: 100,
      segments,
    };
  }

  const targetLevel = current + 1;

  // Ottimizzazione issue #138: estraiamo unicamente gli item richiesti dai livelli pendenti (> current)
  // anziché clonare l'intero inventario Stash, e allochiamo a cascata (waterfall) dal livello attivo in su.
  const remainingInventory: Record<string, number> = {};
  for (const lvl of list.levels) {
    if (lvl.level > current && lvl.requirementItemIds) {
      for (const req of lvl.requirementItemIds) {
        if (remainingInventory[req.itemId] === undefined) {
          const count = inventory[req.itemId];
          if (count !== undefined && count > 0) {
            remainingInventory[req.itemId] = count;
          }
        }
      }
    }
  }

  // Alloca le risorse consumando remainingInventory livello per livello
  const allocateForLevel = (lvlNum: number): Record<string, number> => {
    const allocated: Record<string, number> = {};
    const lvlData = list.levels.find(l => l.level === lvlNum);
    if (!lvlData?.requirementItemIds) return allocated;

    for (const req of lvlData.requirementItemIds) {
      const isDelivered = checkedActions?.[`${list.id}|${lvlNum}|item_${req.itemId}`];
      if (isDelivered) {
        // Se già consegnato, non attinge dall'inventario
        continue;
      }
      const available = remainingInventory[req.itemId] ?? 0;
      const take = Math.min(req.quantity, Math.max(0, available));
      allocated[req.itemId] = take;
      remainingInventory[req.itemId] = available - take;
    }
    return allocated;
  };

  const targetAllocated = allocateForLevel(targetLevel);
  const targetReqPercent = calculateLevelRequirementsPercent(list, targetLevel, targetAllocated, checkedActions);
  const nextLevelPercent = canUpgrade ? 100 : targetReqPercent;

  const segments: ListProgressSegment[] = [];
  for (let lvl = baseLevel + 1; lvl <= maxLevel; lvl++) {
    const isTarget = lvl === targetLevel;
    if (lvl <= current) {
      segments.push({ level: lvl, status: 'completed', percent: 100, isTarget: false });
    } else if (isTarget) {
      segments.push({
        level: lvl,
        status: canUpgrade ? 'ready' : 'in-progress',
        percent: nextLevelPercent,
        isTarget: true,
      });
    } else {
      // Livelli futuri oltre il target corrente: calcoliamo il progresso reale in base ai componenti allocati a cascata
      const lvlAllocated = allocateForLevel(lvl);
      const lvlPercent = calculateLevelRequirementsPercent(list, lvl, lvlAllocated, checkedActions);
      segments.push({
        level: lvl,
        status: lvlPercent > 0 ? 'in-progress' : 'future',
        percent: lvlPercent,
        isTarget: false,
      });
    }
  }

  const completedCount = Math.max(0, current - baseLevel);
  const overallPercent = Math.min(
    100,
    Math.max(0, Math.round(((completedCount * 100) + nextLevelPercent) / totalLevels))
  );

  return {
    baseLevel,
    maxLevel,
    currentLevel: current,
    isMaxed: false,
    canUpgrade,
    overallPercent,
    nextLevelPercent,
    segments,
  };
}
