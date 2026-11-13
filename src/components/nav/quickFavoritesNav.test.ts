import { describe, it, expect } from 'vitest';
import { resolveQuickTarget, findNavItemById } from '@/components/nav/quickFavoritesNav';
import type { NavItem } from '@/lib/navTree';

describe('quickFavoritesNav pure logic', () => {
  describe('resolveQuickTarget', () => {
    it('returns the other favorite when activePage matches fav1', () => {
      expect(resolveQuickTarget(['stash', 'liste'], 'stash')).toBe('liste');
    });

    it('returns fav1 when activePage matches fav2', () => {
      expect(resolveQuickTarget(['stash', 'liste'], 'liste')).toBe('stash');
    });

    it('returns fav1 when activePage is neither fav1 nor fav2', () => {
      expect(resolveQuickTarget(['stash', 'liste'], 'craft')).toBe('stash');
    });

    it('handles undefined or partial quickFavorites gracefully', () => {
      expect(resolveQuickTarget(undefined, 'stash')).toBe('liste');
      expect(resolveQuickTarget([], 'stash')).toBe('liste');
      expect(resolveQuickTarget(['benches'], 'benches')).toBe('liste');
    });
  });

  describe('findNavItemById', () => {
    const sampleTree: NavItem[] = [
      { id: 'stash', label: 'Stash', icon: null },
      {
        id: 'tools',
        label: 'Tools',
        icon: null,
        children: [
          { id: 'items', label: 'Items', icon: null },
          { id: 'quests', label: 'Quests', icon: null },
        ],
      },
    ];

    it('finds top-level nav items', () => {
      const found = findNavItemById('stash', sampleTree);
      expect(found).not.toBeNull();
      expect(found?.label).toBe('Stash');
    });

    it('finds nested nav items in children', () => {
      const found = findNavItemById('quests', sampleTree);
      expect(found).not.toBeNull();
      expect(found?.label).toBe('Quests');
    });

    it('returns null when item is not found', () => {
      expect(findNavItemById('non-existent', sampleTree)).toBeNull();
    });
  });
});
