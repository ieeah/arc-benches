import tradersData from '@/data/traders.json';

export type TraderId = 'celeste' | 'shani' | 'apollo' | 'tian-wen' | 'lance' | 'ermal';

export interface TraderItemPurchase {
  trader: TraderId;
  price: number;
}

const traderItemMap = new Map<string, TraderItemPurchase>();

for (const item of tradersData.items) {
  traderItemMap.set(item.id, {
    trader: item.trader as TraderId,
    price: item.price,
  });
}

/**
 * Returns purchase info if the item is sold by a trader, or null otherwise.
 */
export const getTraderPurchase = (itemId?: string | null): TraderItemPurchase | null => {
  if (!itemId) return null;
  return traderItemMap.get(itemId) ?? null;
};

/**
 * Formats trader display name nicely (e.g. "tian-wen" -> "Tian Wen", "celeste" -> "Celeste").
 */
export const getTraderDisplayName = (trader: TraderId | string): string => {
  switch (trader.toLowerCase()) {
    case 'tian-wen':
    case 'tianwen':
    case 'tian_wen':
      return 'Tian Wen';
    case 'celeste':
      return 'Celeste';
    case 'apollo':
      return 'Apollo';
    case 'lance':
      return 'Lance';
    case 'shani':
      return 'Shani';
    case 'ermal':
      return 'Ermal';
    default:
      return trader.charAt(0).toUpperCase() + trader.slice(1);
  }
};
