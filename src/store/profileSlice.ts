import type { StateCreator } from 'zustand';
import type { AppState, List, MultiProfileExportFile, ProfileExportEntry } from '../types';
import { bootActiveProfileId, bootProfiles } from './boot';
import { freshProfile, hydrateProfile, migrateTargets } from './gameData';
import type { PersistedState } from './persistence';
import { loadProfileState, removeProfileKey, saveProfileState } from './persistence';

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
    const id = crypto.randomUUID();
    set({ profiles: [...s.profiles, { id, name }], activeProfileId: id, ...freshProfile() });
  },

  switchProfile: (newProfileId: string) => {
    const s = get();
    if (s.activeProfileId === newProfileId) return;
    set({ activeProfileId: newProfileId, ...hydrateProfile(loadProfileState(newProfileId)) });
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
      set({ profiles, activeProfileId: newActiveId, ...hydrateProfile(loadProfileState(newActiveId)) });
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
      let hideoutLevels: Record<string, number>;
      let targetLevels: Record<string, number[]>;
      let activeModules: Record<string, boolean>;
      let inventory: Record<string, number>;

      if (profileId === s.activeProfileId) {
        customLists = s.customLists;
        hideoutLevels = s.hideoutLevels;
        targetLevels = s.targetLevels;
        activeModules = s.activeModules;
        inventory = s.inventory;
      } else {
        const state = loadProfileState(profileId);
        customLists = state.customLists ?? [];
        hideoutLevels = state.hideoutLevels ?? {};
        targetLevels = migrateTargets(
          state.targetLevels as Record<string, number | number[]> | undefined,
          state.hideoutLevels,
        );
        activeModules = state.activeModules ?? {};
        inventory = state.inventory ?? {};
      }

      const allLists: List[] = [...s.workbenches, ...s.sharedCustomLists, ...customLists];
      exported.push({
        profile,
        inventory,
        lists: allLists.map(list => ({
          list,
          currentLevel: hideoutLevels[list.id] ?? 0,
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
      const hideoutLevels: Record<string, number> = {};
      const targetLevels: Record<string, number[]> = {};
      const activeModules: Record<string, boolean> = {};
      const listOrder: string[] = [];

      for (const listEntry of entry.lists) {
        const { list, currentLevel, targetLevels: entryTargets, active } = listEntry;
        const isGameList = s.workbenches.some(w => w.id === list.id);
        const isSharedList = data.sharedLists.some(l => l.id === list.id);
        if (!isGameList && !isSharedList && list.custom) customLists.push(list);
        hideoutLevels[list.id] = currentLevel;
        targetLevels[list.id] = entryTargets;
        activeModules[list.id] = active;
        listOrder.push(list.id);
      }

      const profileState: PersistedState = {
        hideoutLevels, targetLevels, activeModules,
        inventory: entry.inventory,
        filterHideCompleted: true, listOrder, customLists, checkedActions: {},
        activePersonalityId: null,
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
      set({ profiles, sharedCustomLists, ...activeProfileState });
    } else {
      set({ profiles, sharedCustomLists });
    }
  },
});
