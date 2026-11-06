import type { StateCreator } from 'zustand';
import type { AppState } from '@/types';
import { bootSettings, bootProfileState } from '@/store/boot';
import { safeLS } from '@/lib/safeStorage';

export type SettingsSlice = Pick<AppState,
  'language' | 'navSide' | 'navVariant' | 'reducedMotion' | 'radialMenuEnabled' | 'quickFavorites' | 'mainProfileId' | 'startupProfileOption' | 'theme' | 'stashViewMode' | 'stashGridDensity' | 'craftMode' |
  'setLanguage' | 'setNavSide' | 'setNavVariant' | 'setReducedMotion' | 'setRadialMenuEnabled' | 'setQuickFavorites' | 'setMainProfileId' | 'setStartupProfileOption' | 'setTheme' | 'setStashViewMode' | 'setStashGridDensity' | 'setCraftMode'
>;

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set) => ({
  language: bootProfileState.language ?? bootSettings.language ?? 'en',
  navSide: bootSettings.navSide,
  navVariant: bootSettings.navVariant ?? 'classic',
  reducedMotion: bootSettings.reducedMotion ?? 'auto',
  radialMenuEnabled: bootSettings.radialMenuEnabled,
  quickFavorites: bootSettings.quickFavorites,
  mainProfileId: bootSettings.mainProfileId,
  startupProfileOption: bootSettings.startupProfileOption,
  theme: bootSettings.theme,
  stashViewMode: bootSettings.stashViewMode,
  stashGridDensity: bootSettings.stashGridDensity,
  craftMode: bootSettings.craftMode ?? 'level-only',

  setLanguage: (language) => {
    safeLS(() => localStorage.setItem('language', language), undefined);
    set({ language });
  },
  setNavSide: (navSide) => set({ navSide }),
  setNavVariant: (navVariant) => {
    safeLS(() => localStorage.setItem('nav-variant', navVariant), undefined);
    set({ navVariant });
  },
  setReducedMotion: (reducedMotion) => {
    safeLS(() => localStorage.setItem('reduced-motion', reducedMotion), undefined);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.reducedMotion = reducedMotion;
    }
    set({ reducedMotion });
  },
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
  setCraftMode: (craftMode) => {
    safeLS(() => localStorage.setItem('craft-mode', craftMode), undefined);
    set({ craftMode });
  },
});
