import type { CustomList, ExpeditionList, List, ListType, PassList, PassTrackDef, ProjectList, QuestList, WorkbenchList } from '@/types';

/**
 * The "base" level a list starts from. A list whose level 1 has no requirements is already
 * unlocked from the start (e.g. Scrappy) → level 0 doesn't exist for it; otherwise it starts at 0.
 */
export const getBaseLevel = (list: List): number =>
  list.levels.find(l => l.level === 1)?.requirementItemIds.length === 0 ? 1 : 0;

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
  const { id, name, description, translations, maxLevel, levels, shared, startDate, expirationDate, prerequisites } = list;
  const base = { id, name, description, translations, maxLevel, levels, shared, startDate, expirationDate, prerequisites };
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
