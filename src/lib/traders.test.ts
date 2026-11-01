import { describe, it, expect } from 'vitest';
import { getTraderPurchase, getTraderDisplayName } from '@/lib/traders';

describe('traders helper', () => {
  it('returns purchase details for a known trader item', () => {
    const purchase = getTraderPurchase('metal-parts');
    expect(purchase).not.toBeNull();
    expect(purchase?.trader).toBe('celeste');
    expect(purchase?.price).toBeGreaterThan(0);
  });

  it('returns null for an item not sold by any trader', () => {
    expect(getTraderPurchase('unknown-item-xyz')).toBeNull();
    expect(getTraderPurchase(null)).toBeNull();
    expect(getTraderPurchase(undefined)).toBeNull();
  });

  it('formats trader display names cleanly', () => {
    expect(getTraderDisplayName('tian-wen')).toBe('Tian Wen');
    expect(getTraderDisplayName('celeste')).toBe('Celeste');
    expect(getTraderDisplayName('apollo')).toBe('Apollo');
  });
});
