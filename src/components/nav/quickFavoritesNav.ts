import type { NavItem } from '@/lib/navTree';

export const resolveQuickTarget = (
  quickFavorites: [string, string] | string[] | undefined,
  activePage: string
): string => {
  const fav1 = quickFavorites?.[0] || 'stash';
  const fav2 = quickFavorites?.[1] || 'liste';
  return activePage === fav1 ? fav2 : fav1;
};

export const findNavItemById = (id: string, list: NavItem[]): NavItem | null => {
  for (const item of list) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findNavItemById(id, item.children);
      if (found) return found;
    }
  }
  return null;
};

export const triggerNavHaptic = (ms = 15): void => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignore */
    }
  }
};
