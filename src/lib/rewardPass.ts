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

/** Pass presente nel gioco (`active` assente vale `true`): gli altri restano nel file come archivio ma l'app li nasconde. */
export const isPassAvailable = (pass: PassList): boolean => pass.active !== false;

/** Un pass è completato quando il livello raggiunto è il massimo (proprietà derivata, non un campo salvato). */
export const isPassCompleted = (pass: PassList, levels: Record<string, number>): boolean =>
  (levels[pass.id] ?? 0) >= pass.maxLevel;

/** Id dei pass completati tra quelli indicati. */
export function getCompletedPassIds(passes: PassList[], levels: Record<string, number>): Set<string> {
  return new Set(passes.filter((p) => isPassCompleted(p, levels)).map((p) => p.id));
}

/** Pass attivo effettivo: esiste, è nel gioco e non è già completato; altrimenti `null`. */
export function resolveActivePass(
  passes: PassList[],
  activeId: string | null,
  levels: Record<string, number>,
): PassList | null {
  if (activeId === null) return null;
  const pass = passes.find((p) => p.id === activeId);
  return pass && isPassAvailable(pass) && !isPassCompleted(pass, levels) ? pass : null;
}

/**
 * Dopo il completamento di un pass attivo: se resta un solo altro pass non completato si attiva da solo (`auto`),
 * se sono di più si chiede quale (`choices`), se non ce n'è nessuno si torna alla selezione.
 */
export function nextActiveAfterCompletion(
  passes: PassList[],
  levels: Record<string, number>,
  completedId: string,
): { auto: string | null; choices: string[] } {
  const candidates = passes
    .filter((p) => p.id !== completedId && isPassAvailable(p) && !isPassCompleted(p, levels))
    .map((p) => p.id);
  if (candidates.length === 1) return { auto: candidates[0], choices: [] };
  return { auto: null, choices: candidates };
}

/** Pass di cui mostrare le card di selezione: quelli nel gioco, divisi tra da fare e completati. */
export function splitPassesByCompletion(passes: PassList[], completedIds: ReadonlySet<string>) {
  const inGame = passes.filter(isPassAvailable);
  return {
    available: inGame.filter((p) => !completedIds.has(p.id)),
    completed: inGame.filter((p) => completedIds.has(p.id)),
  };
}
