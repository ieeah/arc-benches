/**
 * Returns true if every character of `query` appears in order (case-insensitive)
 * within at least one word of `text`. Words are split on spaces and hyphens.
 * Empty query always matches.
 *
 * Per-word matching keeps results tight: "magnet" matches "Magnetron" and
 * "Industrial Magnet" but not "Manganello rovinato" (no single word contains
 * all of m→a→g→n→e→t in sequence).
 *
 * Examples: fuzzyMatch("Industrial Magnet", "magnet") → true
 *           fuzzyMatch("Manganello rovinato", "magnet") → false
 *           fuzzyMatch("Già scaduto", "gia") → true
 */
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const words = text.toLowerCase().split(/[\s\-]+/);
  return words.some(word => {
    let qi = 0;
    for (let ti = 0; ti < word.length && qi < q.length; ti++) {
      if (word[ti] === q[qi]) qi++;
    }
    return qi === q.length;
  });
}
