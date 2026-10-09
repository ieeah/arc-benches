import type { ItemInfo, PassList, PassTrackDef, Reward } from '@/types';

/** Tipo mostrato per le ricompense il cui oggetto non è (più) nel catalogo. */
export const UNKNOWN_REWARD_TYPE = 'Other';

export interface PassRewardSummary {
  /** Valute (`item_type: 'Currency'`): quantità totale per oggetto, dalla più alta. */
  currencies: { itemId: string; quantity: number }[];
  /** Tutte le altre ricompense: quantità totale per tipo di oggetto (blueprint, outfit…), dalla più alta. */
  types: { type: string; quantity: number }[];
  /** Quantità complessiva di ricompense considerate. */
  total: number;
}

/** Ricompense di tutti i livelli del pass, eventualmente solo di una traccia. */
export function getPassRewards(pass: PassList, trackId?: string): Reward[] {
  const first = pass.tracks[0]?.id;
  return pass.levels
    .flatMap((lvl) => lvl.rewards ?? [])
    .filter((r) => !trackId || (r.track ?? first) === trackId);
}

/** Totali delle ricompense del pass: valute per oggetto e il resto per tipo di oggetto. */
export function summarizePassRewards(
  pass: PassList,
  itemsInfo: Record<string, ItemInfo>,
  trackId?: string,
): PassRewardSummary {
  const currencies = new Map<string, number>();
  const types = new Map<string, number>();
  let total = 0;

  for (const reward of getPassRewards(pass, trackId)) {
    const info = itemsInfo[reward.itemId];
    total += reward.quantity;
    if (info?.item_type === 'Currency') {
      currencies.set(reward.itemId, (currencies.get(reward.itemId) ?? 0) + reward.quantity);
    } else {
      const type = info?.item_type || UNKNOWN_REWARD_TYPE;
      types.set(type, (types.get(type) ?? 0) + reward.quantity);
    }
  }

  const byQuantity = <T extends { quantity: number }>(a: T, b: T) => b.quantity - a.quantity;
  return {
    currencies: [...currencies].map(([itemId, quantity]) => ({ itemId, quantity })).sort(byQuantity),
    types: [...types].map(([type, quantity]) => ({ type, quantity })).sort(byQuantity),
    total,
  };
}

/** Nome mostrato di una traccia nella lingua indicata (ripiega sul nome di default). */
export function getTrackName(track: PassTrackDef, language: string): string {
  return track.translations?.[language]?.name || track.name;
}

/** Pass di cui mostrare le card di selezione: tutti quelli del seed, divisi tra da fare e conclusi. */
export function splitPassesByCompletion(passes: PassList[], completedIds: ReadonlySet<string>) {
  return {
    available: passes.filter((p) => !completedIds.has(p.id)),
    completed: passes.filter((p) => completedIds.has(p.id)),
  };
}
