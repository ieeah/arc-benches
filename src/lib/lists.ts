import type { List } from '../types';

/**
 * The "base" level a list starts from. A list whose level 1 has no requirements is already
 * unlocked from the start (e.g. Scrappy) → level 0 doesn't exist for it; otherwise it starts at 0.
 */
export const getBaseLevel = (list: List): number =>
  list.levels.find(l => l.level === 1)?.requirementItemIds.length === 0 ? 1 : 0;
