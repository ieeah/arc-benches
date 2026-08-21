/**
 * Generatore sicuro di UUID v4.
 * Usa `crypto.randomUUID()` se disponibile (ambienti sicuri), altrimenti ricorre
 * a un fallback RFC4122 v4 basato su Math.random() per evitare crash su HTTP o vecchi browser.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
