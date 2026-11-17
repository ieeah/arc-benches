import tradersData from '@/data/traders.json';

export type TraderId =
  | 'celeste'
  | 'shani'
  | 'apollo'
  | 'tian-wen'
  | 'lance'
  | 'nomadic-envoy'
  | 'cassio'
  | 'ermal';

export type TraderCurrency = 'coins' | 'seeds' | 'barter';

export type LocalizedText = {
  en: string;
  it: string;
  [lang: string]: string;
};

export type TraderInfo = {
  id: TraderId;
  name: string;
  role: LocalizedText;
  currency: TraderCurrency;
  resetType: 'daily' | 'weekly' | 'none';
  description: LocalizedText;
};

export type TraderItemPurchase = {
  trader: TraderId;
  price: number;
  dailyLimit?: number;
};

export type DailyResetTime = {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
};

const traderItemMap = new Map<string, TraderItemPurchase>();

for (const item of tradersData.items) {
  traderItemMap.set(item.id, {
    trader: item.trader as TraderId,
    price: item.price,
    dailyLimit: 'dailyLimit' in item ? (item.dailyLimit as number) : undefined,
  });
}

const traderInfoMap = new Map<string, TraderInfo>();

if (Array.isArray(tradersData.traders)) {
  for (const t of tradersData.traders) {
    traderInfoMap.set(t.id, t as unknown as TraderInfo);
  }
}

/**
 * Normalizza l'ID del commerciante risolvendo eventuali alias storici o nomi NPC specifici
 * (es. 'cassio', 'ermal' -> 'nomadic-envoy').
 */
export const normalizeTraderId = (trader: TraderId | string): TraderId => {
  const lower = trader.toLowerCase();
  if (lower === 'ermal' || lower === 'cassio' || lower === 'nomadic-envoy' || lower === 'nomadic_envoy') {
    return 'nomadic-envoy';
  }
  return lower as TraderId;
};

/**
 * Restituisce le informazioni d'acquisto se l'oggetto è venduto da un commerciante, altrimenti null.
 */
export const getTraderPurchase = (itemId?: string | null): TraderItemPurchase | null => {
  if (!itemId) return null;
  return traderItemMap.get(itemId) ?? null;
};

/**
 * Restituisce i metadati descrittivi del commerciante (ruolo, valuta, tipo di reset, lore).
 */
export const getTraderInfo = (trader: TraderId | string): TraderInfo | null => {
  const normalized = normalizeTraderId(trader);
  return traderInfoMap.get(normalized) ?? null;
};

/**
 * Restituisce il ruolo localizzato del commerciante in base alla lingua richiesta.
 */
export const getTraderRole = (trader: TraderId | string, language: string = 'it'): string => {
  const info = getTraderInfo(trader);
  if (!info) return '';
  return info.role[language] ?? info.role.it ?? info.role.en ?? '';
};

/**
 * Restituisce la descrizione localizzata del commerciante in base alla lingua richiesta.
 */
export const getTraderDescription = (trader: TraderId | string, language: string = 'it'): string => {
  const info = getTraderInfo(trader);
  if (!info) return '';
  return info.description[language] ?? info.description.it ?? info.description.en ?? '';
};

/**
 * Restituisce l'elenco di tutti i commercianti censiti nel catalogo di Speranza.
 */
export const getAllTraders = (): TraderInfo[] => {
  return Array.from(traderInfoMap.values());
};

/**
 * Restituisce la valuta accettata dal commerciante ('coins', 'seeds' o 'barter').
 */
export const getTraderCurrency = (trader: TraderId | string): TraderCurrency => {
  const info = getTraderInfo(trader);
  if (info) return info.currency;
  const normalized = normalizeTraderId(trader);
  if (normalized === 'celeste') return 'seeds';
  if (normalized === 'nomadic-envoy') return 'barter';
  return 'coins';
};

/**
 * Formatta il nome visualizzato del commerciante in modo localizzato
 * (es. in IT: "Cassio (Inviato Nomade)", in EN: "Cassio (Nomadic Envoy)").
 */
export const getTraderDisplayName = (trader: TraderId | string, language: string = 'it'): string => {
  const normalized = normalizeTraderId(trader);
  if (normalized === 'nomadic-envoy') {
    const info = getTraderInfo('nomadic-envoy');
    const role = getTraderRole('nomadic-envoy', language);
    return info && role ? `${info.name} (${role})` : role || (language === 'it' ? 'Inviato Nomade' : 'Nomadic Envoy');
  }
  switch (normalized) {
    case 'tian-wen':
      return 'Tian Wen';
    case 'celeste':
      return 'Celeste';
    case 'apollo':
      return 'Apollo';
    case 'lance':
      return 'Lance';
    case 'shani':
      return 'Shani';
    default:
      return trader.charAt(0).toUpperCase() + trader.slice(1);
  }
};

/**
 * Calcola il tempo rimanente fino al prossimo reset globale delle 00:00 UTC.
 */
export const getTimeUntilDailyReset = (now: Date = new Date()): DailyResetTime => {
  const nextReset = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  const diffMs = Math.max(0, nextReset.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${hours}h ${minutes.toString().padStart(2, '0')}m`;

  return {
    hours,
    minutes,
    seconds,
    formatted,
  };
};
