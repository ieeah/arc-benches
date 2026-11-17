import { describe, it, expect } from 'vitest';
import {
  getTraderPurchase,
  getTraderDisplayName,
  getTraderInfo,
  getAllTraders,
  getTraderCurrency,
  getTraderRole,
  getTraderDescription,
  getTimeUntilDailyReset,
  normalizeTraderId,
} from '@/lib/traders';

describe('traders helper', () => {
  it('returns purchase details for a known trader item', () => {
    const purchase = getTraderPurchase('metal-parts');
    expect(purchase).not.toBeNull();
    expect(purchase?.trader).toBe('celeste');
    expect(purchase?.price).toBeGreaterThan(0);
    expect(purchase?.dailyLimit).toBeUndefined();
  });

  it('returns dailyLimit for items with purchase restrictions', () => {
    const raiderKey = getTraderPurchase('raider-hatch-key');
    expect(raiderKey).not.toBeNull();
    expect(raiderKey?.trader).toBe('shani');
    expect(raiderKey?.dailyLimit).toBe(2);

    const complexParts = getTraderPurchase('complex-gun-parts');
    expect(complexParts).not.toBeNull();
    expect(complexParts?.trader).toBe('celeste');
    expect(complexParts?.dailyLimit).toBe(1);

    const barricades = getTraderPurchase('barricade-kit');
    expect(barricades).not.toBeNull();
    expect(barricades?.trader).toBe('apollo');
    expect(barricades?.dailyLimit).toBe(6);

    const heavyShield = getTraderPurchase('heavy-shield');
    expect(heavyShield).not.toBeNull();
    expect(heavyShield?.trader).toBe('lance');
    expect(heavyShield?.dailyLimit).toBe(1);

    const bantam = getTraderPurchase('bantam');
    expect(bantam).not.toBeNull();
    expect(bantam?.trader).toBe('tian-wen');
    expect(bantam?.dailyLimit).toBe(3);
  });

  it('returns null for an item not sold by any trader', () => {
    expect(getTraderPurchase('unknown-item-xyz')).toBeNull();
    expect(getTraderPurchase(null)).toBeNull();
    expect(getTraderPurchase(undefined)).toBeNull();
  });

  it('formats trader display names cleanly in both Italian and English', () => {
    expect(getTraderDisplayName('tian-wen')).toBe('Tian Wen');
    expect(getTraderDisplayName('celeste')).toBe('Celeste');
    expect(getTraderDisplayName('apollo')).toBe('Apollo');
    expect(getTraderDisplayName('lance')).toBe('Lance');
    expect(getTraderDisplayName('shani')).toBe('Shani');

    // nomadic-envoy with localized roles
    expect(getTraderDisplayName('nomadic-envoy', 'it')).toBe('Cassio (Inviato Nomade)');
    expect(getTraderDisplayName('nomadic-envoy', 'en')).toBe('Cassio (Nomadic Envoy)');

    // Character aliases
    expect(getTraderDisplayName('cassio', 'it')).toBe('Cassio (Inviato Nomade)');
    expect(getTraderDisplayName('cassio', 'en')).toBe('Cassio (Nomadic Envoy)');
    expect(getTraderDisplayName('ermal', 'it')).toBe('Cassio (Inviato Nomade)');
    expect(getTraderDisplayName('ermal', 'en')).toBe('Cassio (Nomadic Envoy)');
  });

  it('normalizes trader IDs properly', () => {
    expect(normalizeTraderId('cassio')).toBe('nomadic-envoy');
    expect(normalizeTraderId('ermal')).toBe('nomadic-envoy');
    expect(normalizeTraderId('nomadic-envoy')).toBe('nomadic-envoy');
    expect(normalizeTraderId('celeste')).toBe('celeste');
  });

  it('retrieves localized trader roles and descriptions correctly', () => {
    expect(getTraderRole('celeste', 'it')).toBe('Leader del Rifugio');
    expect(getTraderRole('celeste', 'en')).toBe('Settlement Leader');

    expect(getTraderRole('nomadic-envoy', 'it')).toBe('Inviato Nomade');
    expect(getTraderRole('nomadic-envoy', 'en')).toBe('Nomadic Envoy');

    expect(getTraderDescription('nomadic-envoy', 'it')).toContain('rotazione settimanale');
    expect(getTraderDescription('nomadic-envoy', 'en')).toContain('weekly rotations');

    const nomadic = getTraderInfo('nomadic-envoy');
    expect(nomadic).not.toBeNull();
    expect(nomadic?.id).toBe('nomadic-envoy');
    expect(nomadic?.currency).toBe('barter');
    expect(getTraderCurrency('nomadic-envoy')).toBe('barter');
    expect(getTraderCurrency('cassio')).toBe('barter');
    expect(getTraderCurrency('ermal')).toBe('barter');

    const all = getAllTraders();
    expect(all.length).toBe(6);
  });

  it('calculates deterministic countdown to 00:00 UTC daily reset', () => {
    const fixedTime = new Date(Date.UTC(2026, 10, 17, 14, 30, 0));
    const countdown = getTimeUntilDailyReset(fixedTime);

    expect(countdown.hours).toBe(9);
    expect(countdown.minutes).toBe(30);
    expect(countdown.formatted).toBe('9h 30m');

    const nearReset = new Date(Date.UTC(2026, 10, 17, 23, 55, 0));
    const nearCountdown = getTimeUntilDailyReset(nearReset);

    expect(nearCountdown.hours).toBe(0);
    expect(nearCountdown.minutes).toBe(5);
    expect(nearCountdown.formatted).toBe('0h 05m');
  });
});
