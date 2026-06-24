import { initProfilesMeta, loadProfileState, loadSharedLists } from './persistence';
import { hydrateProfile } from './gameData';

// Resolved once at module load: the persisted profiles, the active profile's hydrated
// state and the global shared lists. Each slice seeds its own keys from these.
const meta = initProfilesMeta();

export const bootProfiles = meta.profiles;
export const bootActiveProfileId = meta.activeProfileId;
export const bootProfileState = hydrateProfile(loadProfileState(meta.activeProfileId));
export const bootSharedLists = loadSharedLists();
