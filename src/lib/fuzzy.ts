/** Minuscolo e senza accenti, così «gia» trova «Già» (era già promesso dalla documentazione). */
const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Returns true if every word of `query` is found, in order of its characters, within at least one
 * word of `text` (case- and accent-insensitive). Words are split on spaces and hyphens, in both the text and the
 * query. Empty query always matches.
 *
 * Per-word matching keeps results tight: "magnet" matches "Magnetron" and
 * "Industrial Magnet" but not "Manganello rovinato" (no single word contains
 * all of m→a→g→n→e→t in sequence). A multi-word query needs each of its words to match, in any
 * order: "battered paper" finds "Battered Paperback" (matching the whole query against one word
 * could never succeed, since a word contains no space).
 *
 * Examples: fuzzyMatch("Industrial Magnet", "magnet") → true
 *           fuzzyMatch("Manganello rovinato", "magnet") → false
 *           fuzzyMatch("Già scaduto", "gia") → true
 *           fuzzyMatch("Battered Paperback", "battered paper") → true
 */
export function fuzzyMatch(text: string, query: string): boolean {
  const tokens = normalize(query).split(/[\s\-]+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const words = normalize(text).split(/[\s\-]+/);
  return tokens.every(token =>
    words.some(word => {
      let qi = 0;
      for (let ti = 0; ti < word.length && qi < token.length; ti++) {
        if (word[ti] === token[qi]) qi++;
      }
      return qi === token.length;
    }),
  );
}
