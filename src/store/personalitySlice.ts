import type { StateCreator } from 'zustand';
import type { AppState, PersonalityProfile } from '../types';
import personalitiesData from '../data/personalities.json';

export const personalities: PersonalityProfile[] = personalitiesData as PersonalityProfile[];

export interface PersonalitySlice {
  activePersonalityId: string | null;
  rollPersonality: () => PersonalityProfile;
  clearPersonality: () => void;
}

export const createPersonalitySlice: StateCreator<AppState, [], [], PersonalitySlice> = (set) => ({
  activePersonalityId: null,

  rollPersonality: () => {
    const idx = Math.floor(Math.random() * personalities.length);
    const chosen = personalities[idx];
    set({ activePersonalityId: chosen.id });
    return chosen;
  },

  clearPersonality: () => {
    set({ activePersonalityId: null });
  },
});
