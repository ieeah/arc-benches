import { create } from 'zustand';
import type { AppState } from '../types';
import { createInventorySlice } from './inventorySlice';
import { createProgressSlice } from './progressSlice';
import { createListsSlice } from './listsSlice';
import { createProfileSlice } from './profileSlice';
import { saveProfileState, saveProfilesMeta, saveSharedLists } from './persistence';

// Domain slices (inventory / progress / lists / profile) combined into one store.
// Static game data (workbenches, itemsInfo) lives in the lists slice; boot state is
// seeded per-slice from store/boot.ts.
export const useAppStore = create<AppState>()((...a) => ({
  ...createInventorySlice(...a),
  ...createProgressSlice(...a),
  ...createListsSlice(...a),
  ...createProfileSlice(...a),
}));

// ---------------------------------------------------------------------------
// Persistence boundary — the single writer.
//
// Persistence is NOT inlined in the actions: this subscription is the only writer for the
// active profile's state, the shared lists and the profiles meta. Actions just call set().
// Writes are synchronous (no debounce): a delayed write would corrupt data across a profile
// switch, and the remote-sync debounce (Fase 2) plugs into this same single boundary instead.
// Cross-profile writes the subscriber cannot infer (writing a NON-active profile, removing a
// deleted profile's key) stay explicit in the profile actions.
// ---------------------------------------------------------------------------

useAppStore.subscribe((state, prev) => {
  if (state.profiles !== prev.profiles || state.activeProfileId !== prev.activeProfileId) {
    saveProfilesMeta({ profiles: state.profiles, activeProfileId: state.activeProfileId });
  }
  if (state.sharedCustomLists !== prev.sharedCustomLists) {
    saveSharedLists(state.sharedCustomLists);
  }
  const profileStateChanged =
    state.hideoutLevels !== prev.hideoutLevels ||
    state.targetLevels !== prev.targetLevels ||
    state.activeModules !== prev.activeModules ||
    state.inventory !== prev.inventory ||
    state.filterHideCompleted !== prev.filterHideCompleted ||
    state.listOrder !== prev.listOrder ||
    state.customLists !== prev.customLists ||
    state.checkedActions !== prev.checkedActions;
  // On a profile switch the active id changes together with all the slice refs:
  // we write the (new) active profile's state to its own key, never the old one.
  if (profileStateChanged || state.activeProfileId !== prev.activeProfileId) {
    saveProfileState(state.activeProfileId, state);
  }
});
