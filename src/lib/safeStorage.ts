/** Run a localStorage operation, falling back when storage is blocked (iframe, privacy mode). */
export function safeLS<T>(op: () => T, fallback: T): T {
  try { return op(); } catch { return fallback; }
}
