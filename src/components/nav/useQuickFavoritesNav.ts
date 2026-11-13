import { useAppStore } from '@/store';
import type { NavItem } from '@/lib/navTree';
import {
  resolveQuickTarget,
  findNavItemById,
  triggerNavHaptic,
} from './quickFavoritesNav';

export type UseQuickFavoritesNavProps = {
  activePage: string;
  navTree: NavItem[];
};

export type UseQuickFavoritesNavReturn = {
  quickFavorites: [string, string] | string[] | undefined;
  nextTargetPage: string;
  nextTargetItem: NavItem | undefined;
  triggerHaptic: (ms?: number) => void;
};

export const useQuickFavoritesNav = ({
  activePage,
  navTree,
}: UseQuickFavoritesNavProps): UseQuickFavoritesNavReturn => {
  const quickFavorites = useAppStore(s => s.quickFavorites);

  const nextTargetPage = resolveQuickTarget(quickFavorites, activePage);
  const nextTargetItem = findNavItemById(nextTargetPage, navTree) ?? navTree[0];

  return {
    quickFavorites,
    nextTargetPage,
    nextTargetItem,
    triggerHaptic: triggerNavHaptic,
  };
};
