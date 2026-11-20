import { describe, it, expect } from 'vitest';
import type { ExpeditionList, TieredAction } from '@/types';
import {
  calculateExpeditionRewardPure,
  getActiveExpeditionPure,
  getCatchupCostPure,
  getExpeditionCatchupSPPure,
  getExpeditionDamageTierPure,
  getMaxAllowedExpeditionSPPure,
  getMaxCatchupSPPure,
  getTimeRemainingPure,
  isCatchupUnlockedPure,
  isDepartureWindowActivePure,
  isExpeditionPhaseReady,
  isListExpired,
} from './expeditions';

function makeExpedition(overrides: Partial<ExpeditionList> & { id: string }): ExpeditionList {
  return {
    name: overrides.id,
    listType: 'expedition',
    expeditionIndex: 1,
    maxLevel: 1,
    levels: [
      {
        level: 1,
        requirementItemIds: [],
      },
    ],
    ...overrides,
  };
}

describe('Expeditions Engine', () => {
  describe('isListExpired', () => {
    const now = Date.UTC(2026, 4, 15, 12, 0, 0);

    it('returns false when expirationDate is missing or invalid', () => {
      expect(isListExpired({}, now)).toBe(false);
      expect(isListExpired({ expirationDate: 'not-a-date' }, now)).toBe(false);
    });

    it('returns false when expirationDate is in the future', () => {
      const future = new Date(now + 60_000).toISOString();
      expect(isListExpired({ expirationDate: future }, now)).toBe(false);
    });

    it('returns true when expirationDate is at or before now', () => {
      expect(isListExpired({ expirationDate: new Date(now).toISOString() }, now)).toBe(true);
      expect(isListExpired({ expirationDate: new Date(now - 1000).toISOString() }, now)).toBe(true);
    });
  });

  describe('getTimeRemainingPure', () => {
    const now = Date.UTC(2026, 4, 15, 12, 0, 0);

    it('returns status none when expirationDate is undefined or invalid', () => {
      expect(getTimeRemainingPure(undefined, now)).toEqual({
        status: 'none',
        days: 0,
        hours: 0,
        minutes: 0,
        totalHours: 0,
        urgent: false,
        warning: false,
      });
      expect(getTimeRemainingPure('invalid-date', now).status).toBe('none');
    });

    it('returns status expired when expirationDate is in the past or equal to now', () => {
      expect(getTimeRemainingPure(new Date(now).toISOString(), now)).toEqual({
        status: 'expired',
        days: 0,
        hours: 0,
        minutes: 0,
        totalHours: 0,
        urgent: true,
        warning: false,
      });
      expect(getTimeRemainingPure(new Date(now - 3_600_000).toISOString(), now).status).toBe('expired');
    });

    it('marks < 24h as urgent and not warning', () => {
      const target = new Date(now + (5 * 60 + 30) * 60_000).toISOString();
      expect(getTimeRemainingPure(target, now)).toEqual({
        status: 'active',
        days: 0,
        hours: 5,
        minutes: 30,
        totalHours: 5,
        urgent: true,
        warning: false,
      });
    });

    it('marks 24h..72h as warning and not urgent', () => {
      const target48h = new Date(now + 48 * 3_600_000).toISOString();
      expect(getTimeRemainingPure(target48h, now)).toEqual({
        status: 'active',
        days: 2,
        hours: 0,
        minutes: 0,
        totalHours: 48,
        urgent: false,
        warning: true,
      });

      const target72h = new Date(now + 72 * 3_600_000).toISOString();
      expect(getTimeRemainingPure(target72h, now).warning).toBe(true);
    });

    it('marks > 72h as neither urgent nor warning', () => {
      const diffMs = ((5 * 24 + 3) * 60 + 15) * 60_000;
      const target = new Date(now + diffMs).toISOString();
      expect(getTimeRemainingPure(target, now)).toEqual({
        status: 'active',
        days: 5,
        hours: 3,
        minutes: 15,
        totalHours: 123,
        urgent: false,
        warning: false,
      });
    });
  });

  describe('isExpeditionPhaseReady', () => {
    const caravan = makeExpedition({
      id: 'exp-1',
      maxLevel: 2,
      levels: [
        {
          level: 1,
          requirementItemIds: [
            { itemId: 'metal-parts', quantity: 10 },
            { itemId: 'wires', quantity: 5 },
          ],
          actions: [{ id: 'act-1', label: 'Deliver crate' }],
          tieredActions: [
            {
              id: 'ta-1',
              label: 'Damage',
              steps: [
                { id: 's1', label: 'Step 1' },
                { id: 's2', label: 'Step 2' },
              ],
            },
          ],
        },
        {
          level: 2,
          requirementItemIds: [],
        },
      ],
    });

    it('returns false when level does not exist', () => {
      expect(isExpeditionPhaseReady(caravan, 99, {}, {})).toBe(false);
    });

    it('returns true for a phase with no requirements', () => {
      expect(isExpeditionPhaseReady(caravan, 2, {}, {})).toBe(true);
    });

    it('requires items (via inventory or checkedActions), actions, and all tiered steps', () => {
      const allActions = {
        'exp-1|1|act-1': true,
        'exp-1|1|ta-1:s1': true,
        'exp-1|1|ta-1:s2': true,
      };

      // Missing items
      expect(isExpeditionPhaseReady(caravan, 1, { 'metal-parts': 10, wires: 4 }, allActions)).toBe(false);

      // Satisfied via inventory
      expect(isExpeditionPhaseReady(caravan, 1, { 'metal-parts': 10, wires: 5 }, allActions)).toBe(true);

      // Satisfied via checkedActions even with empty inventory
      expect(
        isExpeditionPhaseReady(
          caravan,
          1,
          {},
          {
            ...allActions,
            'exp-1|1|item_metal-parts': true,
            'exp-1|1|item_wires': true,
          },
        ),
      ).toBe(true);

      // Missing action
      expect(
        isExpeditionPhaseReady(
          caravan,
          1,
          { 'metal-parts': 10, wires: 5 },
          { 'exp-1|1|ta-1:s1': true, 'exp-1|1|ta-1:s2': true },
        ),
      ).toBe(false);

      // Missing one tiered step
      expect(
        isExpeditionPhaseReady(
          caravan,
          1,
          { 'metal-parts': 10, wires: 5 },
          { 'exp-1|1|act-1': true, 'exp-1|1|ta-1:s1': true },
        ),
      ).toBe(false);
    });
  });

  describe('getActiveExpeditionPure', () => {
    const exp1 = makeExpedition({ id: 'exp-1', expeditionIndex: 1 });
    const exp2 = makeExpedition({ id: 'exp-2', expeditionIndex: 2 });
    const exp3 = makeExpedition({ id: 'exp-3', expeditionIndex: 3 });

    it('returns undefined when expeditions list is empty', () => {
      expect(getActiveExpeditionPure([], 0)).toBeUndefined();
    });

    it('returns matching 1-indexed expedition for completedExpeditionsCount', () => {
      expect(getActiveExpeditionPure([exp1, exp2, exp3], 0)?.id).toBe('exp-1');
      expect(getActiveExpeditionPure([exp1, exp2, exp3], 1)?.id).toBe('exp-2');
      expect(getActiveExpeditionPure([exp1, exp2, exp3], 2)?.id).toBe('exp-3');
    });

    it('cycles when completedExpeditionsCount exceeds defined expeditions', () => {
      expect(getActiveExpeditionPure([exp1, exp2, exp3], 3)?.id).toBe('exp-1');
      expect(getActiveExpeditionPure([exp1, exp2, exp3], 4)?.id).toBe('exp-2');
    });

    it('falls back to last expedition if cyclicIndex is not found', () => {
      const nonSequential = [
        makeExpedition({ id: 'exp-10', expeditionIndex: 10 }),
        makeExpedition({ id: 'exp-20', expeditionIndex: 20 }),
      ];
      expect(getActiveExpeditionPure(nonSequential, 0)?.id).toBe('exp-20');
    });
  });

  describe('getExpeditionDamageTierPure', () => {
    it('counts checked steps on explicit damageChallenge across supported key formats', () => {
      const challenge: TieredAction = {
        id: 'dmg',
        label: 'Damage Tiers',
        steps: [
          { id: 't1', label: 'Tier 1' },
          { id: 't2', label: 'Tier 2' },
          { id: 't3', label: 'Tier 3' },
          { id: 't4', label: 'Tier 4' },
        ],
      };

      const checked: Record<string, boolean> = {
        'expedition-damage|0|dmg:t1': true,
        'expedition-damage|0|t2': true,
        'expedition-damage|0|tier_t3': true,
      };

      expect(getExpeditionDamageTierPure(checked, challenge)).toBe(3);
      expect(getExpeditionDamageTierPure({}, challenge)).toBe(0);
    });

    it('falls back to default 5 tiers when damageChallenge is omitted or empty', () => {
      const checked: Record<string, boolean> = {
        'expedition-damage|0|tier_1': true,
        'expedition-damage|0|damage-challenge:tier-2': true,
        'expedition-damage|0|tier_5': true,
      };

      expect(getExpeditionDamageTierPure(checked)).toBe(3);
      expect(getExpeditionDamageTierPure(checked, null)).toBe(3);
      expect(getExpeditionDamageTierPure({})).toBe(0);
    });
  });

  describe('getExpeditionCatchupSPPure', () => {
    const checked: Record<string, boolean> = {
      'expedition-catchup|0|sp_1': true,
      'expedition-catchup|0|sp_2': true,
      'expedition-catchup|0|sp_3': true,
      'expedition-catchup|0|sp_4': true,
      'expedition-catchup|0|sp_5': true,
    };

    it('counts checked catch-up SP up to default maxLimit of 5', () => {
      expect(getExpeditionCatchupSPPure({})).toBe(0);
      expect(getExpeditionCatchupSPPure(checked)).toBe(5);
    });

    it('clamps maxLimit between 0 and 5', () => {
      expect(getExpeditionCatchupSPPure(checked, 2)).toBe(2);
      expect(getExpeditionCatchupSPPure(checked, 0)).toBe(0);
      expect(getExpeditionCatchupSPPure(checked, -3)).toBe(0);
      expect(getExpeditionCatchupSPPure(checked, 15)).toBe(5);
    });
  });

  describe('calculateExpeditionRewardPure', () => {
    it('awards 1 SP per damage tier plus catchupSP for expeditions 1-3 (completed < 3)', () => {
      expect(calculateExpeditionRewardPure(0, 5, 0)).toEqual({
        skillPoints: 5,
        tokenReward: 0,
        blueprintReward: 0,
      });
      expect(calculateExpeditionRewardPure(2, 5, 5)).toEqual({
        skillPoints: 10,
        tokenReward: 0,
        blueprintReward: 0,
      });
    });

    it('awards 150 tokens and 1 blueprint per damage tier for expeditions 4+ (completed >= 3)', () => {
      expect(calculateExpeditionRewardPure(3, 4, 2)).toEqual({
        skillPoints: 2,
        tokenReward: 600,
        blueprintReward: 4,
      });
      expect(calculateExpeditionRewardPure(5, 0, 5)).toEqual({
        skillPoints: 5,
        tokenReward: 0,
        blueprintReward: 0,
      });
    });
  });

  describe('isDepartureWindowActivePure', () => {
    const now = Date.UTC(2026, 4, 15, 12, 0, 0);

    it('returns false when expedition is undefined', () => {
      expect(isDepartureWindowActivePure(undefined, now)).toBe(false);
    });

    it('returns true when no startDate or expirationDate is defined', () => {
      const exp = makeExpedition({ id: 'exp-open' });
      expect(isDepartureWindowActivePure(exp, now)).toBe(true);
    });

    it('returns false before startDate (future window) and after expirationDate (closed window)', () => {
      const future = makeExpedition({
        id: 'exp-future',
        startDate: new Date(now + 60_000).toISOString(),
        expirationDate: new Date(now + 120_000).toISOString(),
      });
      expect(isDepartureWindowActivePure(future, now)).toBe(false);

      const past = makeExpedition({
        id: 'exp-past',
        startDate: new Date(now - 120_000).toISOString(),
        expirationDate: new Date(now - 60_000).toISOString(),
      });
      expect(isDepartureWindowActivePure(past, now)).toBe(false);
    });

    it('returns true when now is within [startDate, expirationDate]', () => {
      const active = makeExpedition({
        id: 'exp-active',
        startDate: new Date(now - 60_000).toISOString(),
        expirationDate: new Date(now + 60_000).toISOString(),
      });
      expect(isDepartureWindowActivePure(active, now)).toBe(true);
      expect(isDepartureWindowActivePure(active, now - 60_000)).toBe(true);
      expect(isDepartureWindowActivePure(active, now + 60_000)).toBe(true);
    });
  });

  describe('getMaxAllowedExpeditionSPPure', () => {
    it('returns 0 for <= 0 completed expeditions, 5 per expedition up to 3, and caps at maxExtraSP', () => {
      expect(getMaxAllowedExpeditionSPPure(-1)).toBe(0);
      expect(getMaxAllowedExpeditionSPPure(0)).toBe(0);
      expect(getMaxAllowedExpeditionSPPure(1)).toBe(5);
      expect(getMaxAllowedExpeditionSPPure(2)).toBe(10);
      expect(getMaxAllowedExpeditionSPPure(3)).toBe(15);
      expect(getMaxAllowedExpeditionSPPure(5)).toBe(15);
      expect(getMaxAllowedExpeditionSPPure(2, 8)).toBe(8);
      expect(getMaxAllowedExpeditionSPPure(4, 20)).toBe(20);
    });
  });

  describe('getMaxCatchupSPPure', () => {
    it('computes missed past SP capped at 5 per expedition', () => {
      expect(getMaxCatchupSPPure(0, 0)).toBe(0);
      expect(getMaxCatchupSPPure(1, 0)).toBe(5);
      expect(getMaxCatchupSPPure(1, 3)).toBe(2);
      expect(getMaxCatchupSPPure(1, 5)).toBe(0);
      expect(getMaxCatchupSPPure(3, 2)).toBe(5);
      expect(getMaxCatchupSPPure(3, 12)).toBe(3);
      expect(getMaxCatchupSPPure(4, 15)).toBe(0);
      expect(getMaxCatchupSPPure(2, 20)).toBe(0);
    });
  });

  describe('getCatchupCostPure', () => {
    it('returns 300,000 credits per catch-up SP and clamps negative values to 0', () => {
      expect(getCatchupCostPure(0)).toBe(0);
      expect(getCatchupCostPure(-2)).toBe(0);
      expect(getCatchupCostPure(1)).toBe(300_000);
      expect(getCatchupCostPure(5)).toBe(1_500_000);
    });
  });

  describe('isCatchupUnlockedPure', () => {
    it('unlocks catch-up only when damageTier >= 5', () => {
      expect(isCatchupUnlockedPure(0)).toBe(false);
      expect(isCatchupUnlockedPure(4)).toBe(false);
      expect(isCatchupUnlockedPure(5)).toBe(true);
      expect(isCatchupUnlockedPure(6)).toBe(true);
    });
  });
});
