import type { StateCreator } from 'zustand';
import type { AppState } from '@/types';
import { bootSettings } from '@/store/boot';

export type SettingsSlice = Pick<AppState,
  'navSide' | 'radialMenuEnabled' | 'quickFavorites' | 'mainProfileId' | 'startupProfileOption' |
  'setNavSide' | 'setRadialMenuEnabled' | 'setQuickFavorites' | 'setMainProfileId' | 'setStartupProfileOption'
>;

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set) => ({
  navSide: bootSettings.navSide,
  radialMenuEnabled: bootSettings.radialMenuEnabled,
  quickFavorites: bootSettings.quickFavorites,
  mainProfileId: bootSettings.mainProfileId,
  startupProfileOption: bootSettings.startupProfileOption,

  setNavSide: (navSide) => set({ navSide }),
  setRadialMenuEnabled: (radialMenuEnabled) => set({ radialMenuEnabled }),
  setQuickFavorites: (quickFavorites) => set({ quickFavorites }),
  setMainProfileId: (mainProfileId) => set({ mainProfileId }),
  setStartupProfileOption: (startupProfileOption) => set({ startupProfileOption }),
});
