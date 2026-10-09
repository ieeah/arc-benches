/**
 * Segnalazioni per le pagine Dev: cosa di una lista (o di un pass) va corretto a mano.
 * Funzione pura, senza accesso a store o storage, così è testabile.
 */
import type { ItemInfo, List, ListLevel, Reward } from '@/types';
import { isPass } from '@/lib/lists';
import { getGameMap } from '@/lib/maps';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface ListIssue {
  severity: IssueSeverity;
  message: string;
  /** Livelli coinvolti (assente = riguarda l'intera lista). */
  levels?: number[];
  /** Oggetto coinvolto, se c'è. */
  itemId?: string;
}

const referencedItems = (level: ListLevel): { itemId: string; where: string }[] => {
  const refs: { itemId: string; where: string }[] = [];
  const addRewards = (rewards: Reward[] | undefined, where: string) => {
    for (const r of rewards ?? []) refs.push({ itemId: r.itemId, where });
  };
  for (const req of level.requirementItemIds) {
    refs.push({ itemId: req.itemId, where: 'requisito' });
    addRewards(req.rewards, 'ricompensa di un requisito');
  }
  addRewards(level.rewards, 'ricompensa di livello');
  for (const action of level.actions ?? []) {
    addRewards(action.rewards, 'ricompensa di un\'azione');
    for (const c of action.carryItems ?? []) refs.push({ itemId: c.itemId, where: 'oggetto da portare' });
  }
  for (const tiered of level.tieredActions ?? []) {
    for (const step of tiered.steps) {
      addRewards(step.rewards, 'ricompensa di uno scaglione');
      for (const c of step.carryItems ?? []) refs.push({ itemId: c.itemId, where: 'oggetto da portare' });
    }
  }
  return refs;
};

/**
 * @param catalog catalogo effettivo (id → oggetto)
 * @param review note «da rivedere» degli oggetti custom (id → note)
 */
export function findListIssues(list: List, catalog: Record<string, ItemInfo>, review: Record<string, string[]>): ListIssue[] {
  const issues: ListIssue[] = [];
  const missing = new Map<string, Set<number>>();
  const reviewed = new Map<string, Set<number>>();
  const unknownMaps = new Map<string, Set<number>>();

  for (const level of list.levels) {
    for (const { itemId } of referencedItems(level)) {
      if (!catalog[itemId]) {
        if (!missing.has(itemId)) missing.set(itemId, new Set());
        missing.get(itemId)!.add(level.level);
      } else if (review[itemId]?.length) {
        if (!reviewed.has(itemId)) reviewed.set(itemId, new Set());
        reviewed.get(itemId)!.add(level.level);
      }
    }
    for (const action of level.actions ?? []) {
      for (const map of action.maps ?? []) if (!getGameMap(map)) unknownMaps.set(map, (unknownMaps.get(map) ?? new Set()).add(level.level));
    }
    for (const tiered of level.tieredActions ?? []) {
      for (const step of tiered.steps) {
        for (const map of step.maps ?? []) if (!getGameMap(map)) unknownMaps.set(map, (unknownMaps.get(map) ?? new Set()).add(level.level));
      }
    }
  }

  const sorted = (levels: Set<number>) => [...levels].sort((a, b) => a - b);

  for (const [itemId, levels] of missing) {
    issues.push({ severity: 'error', itemId, levels: sorted(levels), message: `Oggetto «${itemId}» non presente nel catalogo: crealo come oggetto custom o correggi l'id` });
  }
  for (const [map, levels] of unknownMaps) {
    issues.push({ severity: 'warning', levels: sorted(levels), message: `Mappa «${map}» non presente nel catalogo delle mappe` });
  }
  for (const [itemId, levels] of reviewed) {
    issues.push({ severity: 'warning', itemId, levels: sorted(levels), message: `«${catalog[itemId].name}» da rivedere: ${review[itemId].join('; ')}` });
  }

  if (isPass(list)) {
    const trackIds = new Set(list.tracks.map((t) => t.id));
    const perTrack = new Map<string, number>(list.tracks.map((t) => [t.id, 0]));
    const emptyLevels: number[] = [];
    for (const level of list.levels) {
      if (!level.rewards || level.rewards.length === 0) emptyLevels.push(level.level);
      for (const r of level.rewards ?? []) {
        const track = r.track ?? list.tracks[0]?.id;
        if (track && !trackIds.has(track)) {
          issues.push({ severity: 'error', itemId: r.itemId, levels: [level.level], message: `Ricompensa su una traccia non dichiarata («${track}»)` });
        } else if (track) perTrack.set(track, (perTrack.get(track) ?? 0) + 1);
      }
    }
    for (const track of list.tracks) {
      if ((perTrack.get(track.id) ?? 0) === 0) issues.push({ severity: 'warning', message: `La traccia «${track.name}» non ha nessuna ricompensa` });
    }
    if (emptyLevels.length > 0) {
      issues.push({ severity: 'info', levels: emptyLevels, message: `${emptyLevels.length} livelli senza nessuna ricompensa` });
    }
  }

  const order: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Note «da rivedere» degli oggetti custom, per `findListIssues`. */
export function reviewNotes(customItems: Record<string, { review?: string[] }>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(customItems).filter(([, def]) => def.review?.length).map(([id, def]) => [id, def.review!]));
}
