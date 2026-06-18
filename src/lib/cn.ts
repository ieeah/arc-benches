/**
 * Tiny classnames-style helper: join class strings, filtering falsy values and
 * resolving `{ 'class': condition }` objects and nested arrays. Avoids ternaries
 * inside JSX className. (Local util instead of a dependency: zero lockfile risk.)
 */
export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...args: ClassValue[]): string {
  const out: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string' || typeof arg === 'number') {
      out.push(String(arg));
    } else if (Array.isArray(arg)) {
      const inner = cn(...arg);
      if (inner) out.push(inner);
    } else if (typeof arg === 'object') {
      for (const [key, val] of Object.entries(arg)) {
        if (val) out.push(key);
      }
    }
  }
  return out.join(' ');
}
