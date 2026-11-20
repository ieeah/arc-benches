import type { ItemRequirement, QuestList, Reward } from '@/types';

export type QuestFilterOptions = {
  trader?: string;
  searchQuery?: string;
  getName?: (quest: QuestList) => string;
};

export type QuestAggregation = {
  requirements: ItemRequirement[];
  rewards: Reward[];
};

function buildQuestMap(quests: readonly QuestList[]): Map<string, QuestList> {
  const map = new Map<string, QuestList>();
  for (const quest of quests) {
    map.set(quest.id, quest);
  }
  return map;
}

function toIdSet(ids: ReadonlySet<string> | readonly string[]): Set<string> {
  return ids instanceof Set ? new Set(ids) : new Set(ids);
}

/**
 * Restituisce la quest corrispondente a `questId`, oppure `undefined` se non trovata.
 */
export function getQuestById(
  quests: readonly QuestList[],
  questId: string,
): QuestList | undefined {
  if (!questId) return undefined;
  return quests.find((quest) => quest.id === questId);
}

/**
 * Restituisce le quest prerequisito dirette della quest `questId` (nell'ordine dichiarato).
 * Eventuali ID prerequisito non presenti in `quests` vengono ignorati.
 */
export function getPrerequisiteQuests(
  quests: readonly QuestList[],
  questId: string,
): QuestList[] {
  const target = getQuestById(quests, questId);
  if (!target?.prerequisites?.length) return [];

  const questMap = buildQuestMap(quests);
  const seen = new Set<string>();
  const result: QuestList[] = [];

  for (const prereqId of target.prerequisites) {
    if (seen.has(prereqId)) continue;
    seen.add(prereqId);
    const prereq = questMap.get(prereqId);
    if (prereq) {
      result.push(prereq);
    }
  }

  return result;
}

/**
 * Restituisce le quest che hanno `questId` tra i propri prerequisiti diretti.
 */
export function getUnlockedNextQuests(
  quests: readonly QuestList[],
  questId: string,
): QuestList[] {
  if (!questId) return [];
  return quests.filter((quest) => quest.prerequisites?.includes(questId) ?? false);
}

/**
 * Restituisce le quest non ancora completate i cui prerequisiti sono tutti presenti in `completedQuestIds`.
 */
export function getAvailableQuests(
  quests: readonly QuestList[],
  completedQuestIds: ReadonlySet<string> | readonly string[],
): QuestList[] {
  const completed = toIdSet(completedQuestIds);

  return quests.filter((quest) => {
    if (completed.has(quest.id)) return false;
    const prereqs = quest.prerequisites;
    if (!prereqs || prereqs.length === 0) return true;
    return prereqs.every((prereqId) => completed.has(prereqId));
  });
}

/**
 * Filtra le quest per `trader` e/o `searchQuery` (case-insensitive sul nome restituito da `getName` o `quest.name`).
 */
export function filterQuests(
  quests: readonly QuestList[],
  options: QuestFilterOptions = {},
): QuestList[] {
  const { trader, searchQuery, getName } = options;
  const normalizedTrader = trader?.trim() ?? '';
  const normalizedQuery = searchQuery?.trim().toLowerCase() ?? '';

  return quests.filter((quest) => {
    if (normalizedTrader && quest.trader !== normalizedTrader) {
      return false;
    }
    if (normalizedQuery) {
      const name = getName ? getName(quest) : quest.name;
      if (!name.toLowerCase().includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });
}

function addToQuantityMap(map: Map<string, number>, itemId: string, quantity: number): void {
  if (quantity <= 0) return;
  map.set(itemId, (map.get(itemId) ?? 0) + quantity);
}

/**
 * Aggrega i requisiti (`requirementItemIds`) e le ricompense (`rewards`) per l'insieme di quest indicato.
 * Le quantità di oggetti con lo stesso `itemId` vengono sommate.
 */
export function aggregateQuestRequirementsAndRewards(
  quests: readonly QuestList[],
  questIds: ReadonlySet<string> | readonly string[],
): QuestAggregation {
  const questMap = buildQuestMap(quests);
  const uniqueIds = toIdSet(questIds);

  const reqMap = new Map<string, number>();
  const rewardMap = new Map<string, number>();

  for (const questId of uniqueIds) {
    const quest = questMap.get(questId);
    if (!quest) continue;

    for (const level of quest.levels) {
      for (const req of level.requirementItemIds) {
        addToQuantityMap(reqMap, req.itemId, req.quantity);
        if (req.rewards) {
          for (const reward of req.rewards) {
            addToQuantityMap(rewardMap, reward.itemId, reward.quantity);
          }
        }
      }

      if (level.rewards) {
        for (const reward of level.rewards) {
          addToQuantityMap(rewardMap, reward.itemId, reward.quantity);
        }
      }

      if (level.actions) {
        for (const action of level.actions) {
          if (action.rewards) {
            for (const reward of action.rewards) {
              addToQuantityMap(rewardMap, reward.itemId, reward.quantity);
            }
          }
        }
      }

      if (level.tieredActions) {
        for (const tiered of level.tieredActions) {
          for (const step of tiered.steps) {
            if (step.rewards) {
              for (const reward of step.rewards) {
                addToQuantityMap(rewardMap, reward.itemId, reward.quantity);
              }
            }
          }
        }
      }
    }
  }

  const requirements: ItemRequirement[] = Array.from(reqMap, ([itemId, quantity]) => ({
    itemId,
    quantity,
  }));
  const rewards: Reward[] = Array.from(rewardMap, ([itemId, quantity]) => ({
    itemId,
    quantity,
  }));

  return { requirements, rewards };
}

/**
 * Ricostruisce la catena completa di prerequisiti fino alla radice in ordine topologico
 * (dalle quest radice fino a `questId` inclusa). Restituisce `[]` se `questId` non esiste.
 */
export function getQuestChain(
  quests: readonly QuestList[],
  questId: string,
): QuestList[] {
  const questMap = buildQuestMap(quests);
  if (!questMap.has(questId)) return [];

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const chain: QuestList[] = [];

  const visit = (id: string): void => {
    if (visited.has(id) || visiting.has(id)) return;
    const quest = questMap.get(id);
    if (!quest) return;

    visiting.add(id);
    if (quest.prerequisites) {
      for (const prereqId of quest.prerequisites) {
        visit(prereqId);
      }
    }
    visiting.delete(id);
    visited.add(id);
    chain.push(quest);
  };

  visit(questId);
  return chain;
}
