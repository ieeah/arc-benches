import type { LevelRequirement, List } from '@/types';
import { getCascadeLowering, unmetRequirements } from '@/lib/lists';

/** Primo requisito su un'altra lista che impedisce di raggiungere il livello richiesto. */
export interface LevelBlocker {
  /** Livello (oltre al corrente) che non si può raggiungere finché il requisito non è soddisfatto. */
  blockedLevel: number;
  /** Nome della lista richiesta e livello che deve raggiungere. */
  requiredList: string;
  requiredLevel: number;
}

/**
 * Se salire a `targetLevel` è impedito da un requisito su un'altra lista: restituisce il primo livello bloccato
 * (tra il corrente e il richiesto) e cosa serve per sbloccarlo.
 */
export function levelBlocker(
  list: List,
  current: number,
  targetLevel: number,
  currentLevels: Record<string, number>,
  nameOf: (listId: string) => string,
): LevelBlocker | null {
  for (const lvl of [...list.levels].sort((a, b) => a.level - b.level)) {
    if (lvl.level <= current || lvl.level > targetLevel) continue;
    const unmet = unmetRequirements(lvl, currentLevels)[0];
    if (unmet) return { blockedLevel: lvl.level, requiredList: nameOf(unmet.listId), requiredLevel: unmet.level };
  }
  return null;
}

/** Liste che scendono a catena se `listId` viene portata a `level` (più basso), con il nome e il livello di arrivo. */
export function cascadeEffects(
  lists: List[],
  currentLevels: Record<string, number>,
  listId: string,
  level: number,
  nameOf: (listId: string) => string,
): { name: string; from: number; to: number }[] {
  return getCascadeLowering(lists, currentLevels, listId, level).map((step) => ({
    name: nameOf(step.listId),
    from: step.from,
    to: step.to,
  }));
}

/** Requisiti di un livello con lo stato attuale (soddisfatto o no) e il nome della lista richiesta. */
export function describeRequirements(
  requires: LevelRequirement[] | undefined,
  currentLevels: Record<string, number>,
  nameOf: (listId: string) => string,
): { name: string; level: number; met: boolean }[] {
  return (requires ?? []).map((req) => ({
    name: nameOf(req.listId),
    level: req.level,
    met: (currentLevels[req.listId] ?? 0) >= req.level,
  }));
}
