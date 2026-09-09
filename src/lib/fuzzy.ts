/**
 * Returns true if every character of `query` appears in `text` in order
 * (case-insensitive subsequence match). Empty query always matches.
 *
 * Examples: fuzzyMatch("useListManager", "ulm") → true
 *           fuzzyMatch("Già scaduto", "gia") → true
 */
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}
