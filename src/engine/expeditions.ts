import type { ExpeditionList, List, TieredAction } from '@/types';

/**
 * Checks whether a list has an expiration date and that date is in the past.
 */
export function isListExpired(list: Pick<List, 'expirationDate'>, now: number = Date.now()): boolean {
  if (!list.expirationDate) return false;
  const exp = new Date(list.expirationDate).getTime();
  if (isNaN(exp)) return false;
  return exp <= now;
}

export type TimeRemainingBreakdown = {
  status: 'none' | 'expired' | 'active';
  days: number;
  hours: number;
  minutes: number;
  totalHours: number;
  urgent: boolean;  // < 24h
  warning: boolean; // <= 3d
};

/**
 * Computes pure time-remaining breakdown before a given ISO date expiration.
 */
export function getTimeRemainingPure(
  expirationDate: string | undefined,
  now: number = Date.now(),
): TimeRemainingBreakdown {
  if (!expirationDate) {
    return { status: 'none', days: 0, hours: 0, minutes: 0, totalHours: 0, urgent: false, warning: false };
  }
  const exp = new Date(expirationDate).getTime();
  if (isNaN(exp)) {
    return { status: 'none', days: 0, hours: 0, minutes: 0, totalHours: 0, urgent: false, warning: false };
  }

  const diff = exp - now;
  if (diff <= 0) {
    return { status: 'expired', days: 0, hours: 0, minutes: 0, totalHours: 0, urgent: true, warning: false };
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const urgent = totalHours < 24;
  const warning = !urgent && totalHours <= 72;

  return {
    status: 'active',
    days,
    hours,
    minutes,
    totalHours,
    urgent,
    warning,
  };
}

/**
 * Whether the requirements of one expedition phase are met: every item delivered (ticked or owned),
 * every action done and every tiered step done.
 */
export function isExpeditionPhaseReady(
  caravan: List,
  level: number,
  inventory: Record<string, number>,
  checkedActions: Record<string, boolean>,
): boolean {
  const lvl = caravan.levels.find(l => l.level === level);
  if (!lvl) return false;
  const hasItems = lvl.requirementItemIds.length > 0;
  const hasActions = (lvl.actions?.length ?? 0) > 0;
  const hasTiered = (lvl.tieredActions?.length ?? 0) > 0;

  const isItemsDone = !hasItems || lvl.requirementItemIds.every(
    req => Boolean(checkedActions[`${caravan.id}|${lvl.level}|item_${req.itemId}`]) || (inventory[req.itemId] ?? 0) >= req.quantity,
  );
  const isActionsDone = !hasActions || (lvl.actions ?? []).every(
    a => Boolean(checkedActions[`${caravan.id}|${lvl.level}|${a.id}`]),
  );
  const isTieredDone = !hasTiered || (lvl.tieredActions ?? []).every(
    t => (t.steps ?? []).every(s => Boolean(checkedActions[`${caravan.id}|${lvl.level}|${t.id}:${s.id}`])),
  );
  return isItemsDone && isActionsDone && isTieredDone;
}

/**
 * Returns the active expedition based on completedExpeditionsCount (1-indexed progression).
 */
export function getActiveExpeditionPure(
  expeditions: ExpeditionList[],
  completedExpeditionsCount: number,
): ExpeditionList | undefined {
  if (!expeditions.length) return undefined;
  const targetIndex = completedExpeditionsCount + 1;
  const found = expeditions.find(e => e.expeditionIndex === targetIndex);
  if (found) return found;
  // If player passed all defined caravans, cycle or clamp to last
  const cyclicIndex = ((targetIndex - 1) % expeditions.length) + 1;
  return expeditions.find(e => e.expeditionIndex === cyclicIndex) ?? expeditions[expeditions.length - 1];
}

/**
 * Computes how many damage challenge tiers are checked (0 to total steps).
 */
export function getExpeditionDamageTierPure(
  checkedActions: Record<string, boolean>,
  damageChallenge?: TieredAction | null,
): number {
  if (damageChallenge?.steps && damageChallenge.steps.length > 0) {
    let count = 0;
    for (const step of damageChallenge.steps) {
      if (
        checkedActions[`expedition-damage|0|${damageChallenge.id}:${step.id}`] ||
        checkedActions[`expedition-damage|0|${step.id}`] ||
        checkedActions[`expedition-damage|0|tier_${step.id}`]
      ) {
        count++;
      }
    }
    return count;
  }

  let count = 0;
  for (let i = 1; i <= 5; i++) {
    if (
      checkedActions[`expedition-damage|0|tier_${i}`] ||
      checkedActions[`expedition-damage|0|damage-challenge:tier-${i}`]
    ) {
      count++;
    }
  }
  return count;
}

/**
 * Computes how many catch-up SP checkboxes are selected (0 up to maxLimit, default 5).
 */
export function getExpeditionCatchupSPPure(
  checkedActions: Record<string, boolean>,
  maxLimit: number = 5,
): number {
  let count = 0;
  const limit = Math.max(0, Math.min(5, maxLimit));
  for (let i = 1; i <= limit; i++) {
    if (checkedActions[`expedition-catchup|0|sp_${i}`]) {
      count++;
    }
  }
  return count;
}

export type ExpeditionRewardEstimate = {
  skillPoints: number;
  tokenReward: number;
  blueprintReward: number;
};

/**
 * Calculates estimated prestige rewards based on expedition index and checked challenge tiers.
 * - Expeditions 1-3: each damage tier gives 1 SP.
 * - Expeditions >= 4: each damage tier gives 1 Mystery Reward (+1 Blueprint, +150 Tokens).
 * - Catch-up: each selected point gives 1 SP.
 */
export function calculateExpeditionRewardPure(
  completedExpeditionsCount: number,
  damageTier: number,
  catchupSP: number,
): ExpeditionRewardEstimate {
  let skillPoints = catchupSP;
  let tokenReward = 0;
  let blueprintReward = 0;

  if (completedExpeditionsCount < 3) {
    skillPoints += damageTier;
  } else {
    tokenReward = damageTier * 150;
    blueprintReward = damageTier;
  }

  return {
    skillPoints,
    tokenReward,
    blueprintReward,
  };
}

/**
 * Determines whether the expedition departure window is currently open based on startDate and expirationDate,
 * or if no date bounds are defined, returns true by default.
 */
export function isDepartureWindowActivePure(
  expedition?: List,
  now: number = Date.now(),
): boolean {
  if (!expedition) return false;
  const start = expedition.startDate ? new Date(expedition.startDate).getTime() : undefined;
  const end = expedition.expirationDate ? new Date(expedition.expirationDate).getTime() : undefined;

  if (start !== undefined && !isNaN(start) && now < start) {
    return false; // Window not opened yet
  }
  if (end !== undefined && !isNaN(end) && now > end) {
    return false; // Window already closed / departed
  }
  return true;
}

/**
 * Returns the maximum permanent extra skill points allowed given the number of completed expeditions.
 * Each of the first 3 expeditions grants up to 5 SP (capped at `maxExtraSP`, default 15).
 */
export function getMaxAllowedExpeditionSPPure(
  completedExpeditionsCount: number,
  maxExtraSP: number = 15,
): number {
  if (completedExpeditionsCount <= 0) return 0;
  return completedExpeditionsCount < 3
    ? Math.min(maxExtraSP, completedExpeditionsCount * 5)
    : maxExtraSP;
}

/**
 * Returns the maximum catch-up SP recoverable in the current expedition (0..5),
 * based on missed SP from past completed expeditions.
 */
export function getMaxCatchupSPPure(
  completedExpeditionsCount: number,
  earnedPermanentSkillPoints: number,
  maxExtraSP: number = 15,
): number {
  const maxPossiblePastSP = getMaxAllowedExpeditionSPPure(completedExpeditionsCount, maxExtraSP);
  const missedSP = Math.max(0, maxPossiblePastSP - Math.max(0, earnedPermanentSkillPoints));
  return Math.min(5, missedSP);
}

/**
 * Returns the credit cost required to purchase `catchupSP` catch-up skill points (300,000 per SP).
 */
export function getCatchupCostPure(catchupSP: number): number {
  return Math.max(0, catchupSP) * 300_000;
}

/**
 * Whether catch-up SP is unlocked for the current expedition (requires reaching damage tier 5).
 */
export function isCatchupUnlockedPure(damageTier: number): boolean {
  return damageTier >= 5;
}
