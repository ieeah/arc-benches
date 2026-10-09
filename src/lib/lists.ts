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
  { id: 'premium', name: 'Premium', translations: { it: { name: 'Premium' } } },
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
      };
    case 'custom':
      return { ...base, listType, custom: true };
    default:
      return { ...base, listType };
  }
}
