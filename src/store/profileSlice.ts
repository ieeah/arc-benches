import type { StateCreator } from 'zustand';
import type { AppState, List, MultiProfileExportFile, ProfileExportEntry } from '@/types';
import { bootActiveProfileId, bootProfiles } from '@/store/boot';
import { freshProfile, hydrateProfile, migrateTargets } from '@/store/gameData';
import type { PersistedState } from '@/store/persistence';
import { loadProfileState, removeProfileKey, saveProfileState } from '@/store/persistence';
import { generateUUID } from '@/lib/uuid';

// A profile without an explicit language keeps whatever language is currently active
// (which itself resolves from the global `language` setting at boot).
const withResolvedLanguage = (base: PersistedState, current: AppState['language']): PersistedState =>
  ({ ...base, language: base.language ?? current });

export type ProfileSlice = Pick<AppState,
  'profiles' | 'activeProfileId' |
  'createProfile' | 'switchProfile' | 'renameProfile' | 'deleteProfile' |
  'buildExportData' | 'importMultiProfile'
>;

// The persistence subscriber (store/index.ts) writes the new active profile's state and the
// profiles meta; these actions only handle what it can't infer (writing a NON-active profile,
// removing a deleted profile's key).
export const createProfileSlice: StateCreator<AppState, [], [], ProfileSlice> = (set, get) => ({
  profiles: bootProfiles,
  activeProfileId: bootActiveProfileId,

  createProfile: (name: string) => {
    const s = get();
    const id = generateUUID();
    set({ profiles: [...s.profiles, { id, name }], activeProfileId: id, ...withResolvedLanguage(freshProfile(), s.language) });
  },

  switchProfile: (newProfileId: string) => {
    const s = get();
    if (s.activeProfileId === newProfileId) return;
    set({ activeProfileId: newProfileId, ...withResolvedLanguage(hydrateProfile(loadProfileState(newProfileId)), s.language) });
  },

  renameProfile: (id: string, name: string) => {
    const s = get();
    set({ profiles: s.profiles.map(p => p.id === id ? { ...p, name } : p) });
  },

  deleteProfile: (id: string) => {
    const s = get();
    if (s.profiles.length <= 1) return;
    removeProfileKey(id);
    const profiles = s.profiles.filter(p => p.id !== id);

    if (s.activeProfileId === id) {
      const newActiveId = profiles[0].id;
      set({ profiles, activeProfileId: newActiveId, ...withResolvedLanguage(hydrateProfile(loadProfileState(newActiveId)), s.language) });
    } else {
      set({ profiles });
    }
  },

  buildExportData: (profileIds) => {
    const s = get();
    const exported: ProfileExportEntry[] = [];

    for (const profileId of profileIds) {
      const profile = s.profiles.find(p => p.id === profileId);
      if (!profile) continue;

      let customLists: List[];
      let currentLevels: Record<string, number>;
      let targetLevels: Record<string, number[]>;
      let activeModules: Record<string, boolean>;
      let inventory: Record<string, number>;

      if (profileId === s.activeProfileId) {
        customLists = s.customLists;
        currentLevels = s.currentLevels;
        targetLevels = s.targetLevels;
        activeModules = s.activeModules;
        inventory = s.inventory;
      } else {
        const state = loadProfileState(profileId);
        customLists = state.customLists ?? [];
        currentLevels = state.currentLevels ?? {};
        targetLevels = migrateTargets(
          state.targetLevels as Record<string, number | number[]> | undefined,
          state.currentLevels,
        );
        activeModules = state.activeModules ?? {};
        inventory = state.inventory ?? {};
      }

      const allLists: List[] = [...s.workbenches, ...s.sharedCustomLists, ...customLists];
      exported.push({
        profile,
        inventory,
        language: profileId === s.activeProfileId ? s.language : (loadProfileState(profileId).language ?? s.language),
        lists: allLists.map(list => ({
          list,
          currentLevel: currentLevels[list.id] ?? 0,
          targetLevels: targetLevels[list.id] ?? list.levels.map(l => l.level),
          active: activeModules[list.id] ?? true,
        })),
      });
    }

    return { sharedLists: s.sharedCustomLists, profiles: exported };
  },

  importMultiProfile: (data: MultiProfileExportFile, selectedProfileIds: string[]) => {
    const s = get();

    // Merge shared lists globally (persisted by the subscriber via set below).
    const sharedCustomLists = [...s.sharedCustomLists];
    for (const list of data.sharedLists) {
      const idx = sharedCustomLists.findIndex(l => l.id === list.id);
      if (idx >= 0) sharedCustomLists[idx] = list;
      else sharedCustomLists.push(list);
    }

    let profiles = [...s.profiles];
    let activeProfileState: PersistedState | null = null;

    for (const entry of data.profiles) {
      if (!selectedProfileIds.includes(entry.profile.id)) continue;

      const customLists: List[] = [];
      const currentLevels: Record<string, number> = {};
      const targetLevels: Record<string, number[]> = {};
      const activeModules: Record<string, boolean> = {};
      const listOrder: string[] = [];

      for (const listEntry of entry.lists) {
        const { list, currentLevel, targetLevels: entryTargets, active } = listEntry;
        const isGameList = s.workbenches.some(w => w.id === list.id);
        const isSharedList = data.sharedLists.some(l => l.id === list.id);
        if (!isGameList && !isSharedList && list.custom) customLists.push(list);
        currentLevels[list.id] = currentLevel;
        targetLevels[list.id] = entryTargets;
        activeModules[list.id] = active;
        listOrder.push(list.id);
      }

      const profileState: PersistedState = {
        currentLevels, targetLevels, activeModules,
        inventory: entry.inventory,
        filterHideCompleted: true, listOrder, customLists, checkedActions: {},
        activePersonalityId: null,
        ownedBlueprints: {},
        filterHideOwnedBlueprints: false,
        language: entry.language,
        completedExpeditionsCount: 0,
        earnedPermanentSkillPoints: 0,
        consecutiveStreak: 0,
        departureWindowActive: false,
      };

      if (!profiles.some(p => p.id === entry.profile.id)) profiles = [...profiles, entry.profile];

      if (entry.profile.id === s.activeProfileId) {
        activeProfileState = profileState; // active profile persisted via the subscriber (set below)
      } else {
        saveProfileState(entry.profile.id, profileState); // non-active: write directly
      }
    }

    // The subscriber persists sharedCustomLists, the profiles meta and (if changed) the active state.
    if (activeProfileState) {
      set({ profiles, sharedCustomLists, ...withResolvedLanguage(activeProfileState, get().language) });
    } else {
      set({ profiles, sharedCustomLists });
    }
  },
});
