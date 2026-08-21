import type { StateCreator } from 'zustand';
import type { AppState } from '@/types';
import { bootSettings } from '@/store/boot';
import { safeLS } from '@/lib/safeStorage';

export type SettingsSlice = Pick<AppState,
  'navSide' | 'radialMenuEnabled' | 'quickFavorites' | 'mainProfileId' | 'startupProfileOption' | 'theme' | 'stashViewMode' | 'stashGridDensity' |
  'setNavSide' | 'setRadialMenuEnabled' | 'setQuickFavorites' | 'setMainProfileId' | 'setStartupProfileOption' | 'setTheme' | 'setStashViewMode' | 'setStashGridDensity'
>;

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set) => ({
  navSide: bootSettings.navSide,
  radialMenuEnabled: bootSettings.radialMenuEnabled,
  quickFavorites: bootSettings.quickFavorites,
  mainProfileId: bootSettings.mainProfileId,
  startupProfileOption: bootSettings.startupProfileOption,
  theme: bootSettings.theme,
  stashViewMode: bootSettings.stashViewMode,
  stashGridDensity: bootSettings.stashGridDensity,

  setNavSide: (navSide) => set({ navSide }),
  setRadialMenuEnabled: (radialMenuEnabled) => set({ radialMenuEnabled }),
  setQuickFavorites: (quickFavorites) => set({ quickFavorites }),
  setMainProfileId: (mainProfileId) => set({ mainProfileId }),
  setStartupProfileOption: (startupProfileOption) => set({ startupProfileOption }),
  setTheme: (theme) => {
    safeLS(() => localStorage.setItem('theme', theme), undefined);
    set({ theme });
  },
  setStashViewMode: (stashViewMode) => {
    safeLS(() => localStorage.setItem('stash-view-mode', stashViewMode), undefined);
    set({ stashViewMode });
  },
  setStashGridDensity: (stashGridDensity) => {
    safeLS(() => localStorage.setItem('stash-grid-density', stashGridDensity), undefined);
    set({ stashGridDensity });
  },
});
