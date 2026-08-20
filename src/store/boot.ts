import { initProfilesMeta, loadProfileState, loadSharedLists, loadSettings } from './persistence';
import { hydrateProfile } from './gameData';

// Resolved once at module load: the persisted profiles, the active profile's hydrated
// state, global shared lists and global app settings.
const meta = initProfilesMeta();

export const bootProfiles = meta.profiles;
export const bootActiveProfileId = meta.activeProfileId;
export const bootProfileState = hydrateProfile(loadProfileState(meta.activeProfileId));
export const bootSharedLists = loadSharedLists();
export const bootSettings = loadSettings();
