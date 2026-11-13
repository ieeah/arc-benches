import type { AppLanguage } from '@/i18n/types';
import type { SectionId } from './sections';
import type { List } from './lists';

export type Profile = {
  id: string;
  name: string;
};

export type ListExportEntry = {
  list: List;
  currentLevel: number;
  /** Levels selected as objectives (canonical v2 shape). v1 files migrate `targetLevel` → this. */
  targetLevels: number[];
  active: boolean;
};

export type ListExportFile = {
  /** 1 = legacy single-ceiling target; 2 = per-level target set. Both accepted on import. */
  version: 1 | 2;
  exportedAt: string;
  lists: ListExportEntry[];
  /** Snapshot of the user's inventory quantities at export time. */
  inventory?: Record<string, number>;
};

/** State snapshot for one profile inside a v3 multi-profile export. */
export type ProfileExportEntry = {
  profile: Profile;
  lists: ListExportEntry[];
  inventory: Record<string, number>;
  language?: AppLanguage;
  enabledSections?: Record<SectionId, boolean>;
  checkedActions?: Record<string, boolean>;
  listOrder?: string[];
  completedExpeditionsCount?: number;
  earnedPermanentSkillPoints?: number;
  consecutiveStreak?: number;
  departureWindowActive?: boolean;
  ownedBlueprints?: Record<string, boolean>;
  filterHideCompleted?: boolean;
  filterHideOwnedBlueprints?: boolean;
  activePersonalityId?: string | null;
};

/** Version 3 export: always multi-profile, even when exporting a single profile. */
export type MultiProfileExportFile = {
  version: 3;
  exportedAt: string;
  /** Shared custom list definitions (cross-profile; state lives inside each ProfileExportEntry). */
  sharedLists: List[];
  profiles: ProfileExportEntry[];
};
