/**
 * Conversione della tabella a mano del Legacy Pass (in italiano, come si vede in gioco) verso i nomi
 * inglesi, usando i cosmetici di ARC Tracker (che hanno nomi IT ed EN) e i loro indizi sul pass.
 * Funzioni pure.
 */
import { normName } from './pass-resolver.mjs';

/** Righe di una tabella markdown `| Livello | Oggetto | Dettagli |`. */
export function parseLegacyMarkdown(markdown) {
  const rows = [];
  for (const line of markdown.split('\n')) {
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 3 || !/^\d+$/.test(cells[0])) continue;
    rows.push({ level: Number(cells[0]), name: cells[1], category: cells[2] });
  }
  return rows;
}

const stripAccents = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');

/**
 * Categoria («Dettagli» della tabella) → tipo di ricompensa. `pieces` per toggle e colori di un outfit;
 * `null` per le righe senza categoria (valute).
 */
export function categoryToKind(category) {
  const c = stripAccents(category.toLowerCase()).replace(/\s+/g, ' ').trim();
  if (!c) return { kind: 'item' };
  if (c === 'outfit') return { kind: 'outfit' };
  if (c.startsWith('outfit') && c.includes('scrappy')) return { kind: 'scrappy-outfit' };
  if (c === 'toggles' || c === 'toggle') return { kind: 'outfit-piece', pieces: ['toggles'] };
  if (c === 'colore' || c === 'colori') return { kind: 'outfit-piece', pieces: ['colors'] };
  if (c.includes('toggles') && c.includes('colore')) return { kind: 'outfit-piece', pieces: ['toggles', 'colors'] };
  if (c === 'accessorio zaino') return { kind: 'backpack-attachment' };
  if (c === 'charm per zaino') return { kind: 'backpack-charm' };
  if (c === 'zaino') return { kind: 'backpack' };
  if (c === 'stile del volto' || c === 'stile volto') return { kind: 'face-style' };
  if (c === 'volto') return { kind: 'face' };
  if (c === 'emote') return { kind: 'emote' };
  if (c === 'capelli') return { kind: 'hair' };
  if (c === 'peluria') return { kind: 'facial-hair' };
  if (c === 'strumento raider') return { kind: 'raider-tool' };
  return { kind: 'unknown' };
}

const STOPWORDS = new Set(['di', 'del', 'della', 'dello', 'dei', 'delle', 'd', 'a', 'al', 'il', 'la', 'lo', 'l', 'sul', 'sulla', 'sullo', 'per', 'e']);

const tokens = (s) =>
  stripAccents(String(s).toLowerCase())
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t && !STOPWORDS.has(t));

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

const sameToken = (a, b) => a === b || (Math.min(a.length, b.length) >= 5 && editDistance(a, b) <= 1);

/** Somiglianza tra due nomi in [0, 1]: quota dei termini del nome scritto a mano presenti nell'altro (con un errore di battitura tollerato). */
export function nameScore(written, candidate) {
  const w = tokens(written);
  const c = tokens(candidate);
  if (w.length === 0 || c.length === 0) return 0;
  const hits = w.filter((t) => c.some((u) => sameToken(t, u))).length;
  const coverage = hits / w.length;
  return coverage * (hits / Math.max(c.length, w.length) + 1) / 2;
}

/**
 * Cosmetico che corrisponde a un nome scritto a mano.
 * `candidates`: cosmetici del tipo giusto; `atLevel`: id di quelli che il sito indica a quel livello del pass.
 * Se tra quelli del livello ce n'è uno solo, vince anche con un nome diverso (`bySite`), segnalato.
 */
export function matchCosmetic(written, candidates, atLevel = new Set()) {
  const scored = candidates
    .map((c) => ({ cosmetic: c, score: Math.max(nameScore(written, c.names.it ?? ''), nameScore(written, c.names.en ?? '')) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const levelCandidates = candidates.filter((c) => atLevel.has(c.id));
  if (best && best.score >= 0.6 && (levelCandidates.length === 0 || atLevel.has(best.cosmetic.id))) {
    return { cosmetic: best.cosmetic, score: best.score, method: atLevel.has(best.cosmetic.id) ? 'name+level' : 'name' };
  }
  if (levelCandidates.length === 1) {
    const only = levelCandidates[0];
    return { cosmetic: only, score: nameScore(written, only.names.it ?? ''), method: 'level-only' };
  }
  if (best && best.score >= 0.6) return { cosmetic: best.cosmetic, score: best.score, method: 'name-not-at-level' };
  return null;
}

export { normName };
