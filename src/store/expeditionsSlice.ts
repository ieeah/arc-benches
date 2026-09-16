import type { StateCreator } from 'zustand';
import type { AppState } from '@/types';
import { bootProfileState } from '@/store/boot';
import {
  defaultCurrentLevels,
  defaultTargetLevels,
  defaultActiveModules,
  expeditions,
  MAX_EXTRA_SKILL_POINTS,
} from '@/store/gameData';
import {
  calculateExpeditionRewardPure,
  getExpeditionDamageTierPure,
  getExpeditionCatchupSPPure,
} from '@/store/selectors';

export type ExpeditionsSlice = Pick<
  AppState,
  | 'expeditions'
  | 'completedExpeditionsCount'
  | 'earnedPermanentSkillPoints'
  | 'consecutiveStreak'
  | 'departureWindowActive'
  | 'setExpeditionProfile'
  | 'setDepartureWindowActive'
  | 'confirmDeparture'
  | 'closeWindowWithoutDeparture'
>;

export const createExpeditionsSlice: StateCreator<AppState, [], [], ExpeditionsSlice> = (set, get) => ({
  expeditions,
  completedExpeditionsCount: bootProfileState.completedExpeditionsCount ?? 0,
  earnedPermanentSkillPoints: bootProfileState.earnedPermanentSkillPoints ?? 0,
  consecutiveStreak: bootProfileState.consecutiveStreak ?? 0,
  departureWindowActive: bootProfileState.departureWindowActive ?? false,

  setExpeditionProfile: (partial) => {
    const s = get();
    const maxExpeditions = s.expeditions.length > 0 ? s.expeditions.length : 5;
    const completedExpeditionsCount = partial.completedExpeditionsCount !== undefined
      ? Math.max(0, Math.min(maxExpeditions, Math.floor(partial.completedExpeditionsCount)))
      : s.completedExpeditionsCount;
    const maxAllowedSP = completedExpeditionsCount < 3
      ? completedExpeditionsCount * 5
      : MAX_EXTRA_SKILL_POINTS;
    const earnedPermanentSkillPoints = partial.earnedPermanentSkillPoints !== undefined
      ? Math.max(0, Math.min(maxAllowedSP, Math.floor(partial.earnedPermanentSkillPoints)))
      : Math.min(maxAllowedSP, s.earnedPermanentSkillPoints);
    const consecutiveStreak = partial.consecutiveStreak !== undefined
      ? Math.max(0, Math.min(maxExpeditions, Math.floor(partial.consecutiveStreak)))
      : s.consecutiveStreak;
    const departureWindowActive = partial.departureWindowActive !== undefined
      ? partial.departureWindowActive
      : s.departureWindowActive;

    set({
      completedExpeditionsCount,
      earnedPermanentSkillPoints,
      consecutiveStreak,
      departureWindowActive,
    });
  },

  setDepartureWindowActive: (active) => {
    set({ departureWindowActive: active });
  },

  confirmDeparture: (gainOverride) => {
    const s = get();
    const maxExpeditions = s.expeditions.length > 0 ? s.expeditions.length : 5;
    const currentCompleted = s.completedExpeditionsCount;
    const currentSP = s.earnedPermanentSkillPoints;

    let spGain = 0;
    if (gainOverride !== undefined) {
      spGain = Math.max(0, Math.floor(gainOverride));
    } else {
      const damageTier = getExpeditionDamageTierPure(s.checkedActions);
      const maxPossiblePastSP = Math.min(MAX_EXTRA_SKILL_POINTS, currentCompleted * 5);
      const missedSP = Math.max(0, maxPossiblePastSP - currentSP);
      const maxCatchup = Math.min(5, missedSP);
      const catchupSP = getExpeditionCatchupSPPure(s.checkedActions, maxCatchup);
      const reward = calculateExpeditionRewardPure(currentCompleted, damageTier, catchupSP);
      spGain = reward.skillPoints;
    }

    const newSP = Math.min(MAX_EXTRA_SKILL_POINTS, currentSP + spGain);

    // Clean checkedActions of all expedition-related temporary keys
    const cleanedCheckedActions: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(s.checkedActions)) {
      if (!key.startsWith('expedition-damage|') && !key.startsWith('expedition-catchup|') && !key.startsWith('expedition-')) {
        cleanedCheckedActions[key] = val;
      }
    }

    set({
      inventory: {},
      currentLevels: { ...defaultCurrentLevels },
      targetLevels: { ...defaultTargetLevels },
      activeModules: { ...defaultActiveModules },
      checkedActions: cleanedCheckedActions,
      completedExpeditionsCount: Math.min(maxExpeditions, currentCompleted + 1),
      consecutiveStreak: Math.min(maxExpeditions, s.consecutiveStreak + 1),
      earnedPermanentSkillPoints: newSP,
      departureWindowActive: false,
    });
  },

  closeWindowWithoutDeparture: (clearInventory = false) => {
    const s = get();
    // Clean temporary challenge actions only
    const cleanedCheckedActions: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(s.checkedActions)) {
      if (!key.startsWith('expedition-damage|') && !key.startsWith('expedition-catchup|')) {
        cleanedCheckedActions[key] = val;
      }
    }

    set({
      consecutiveStreak: 0,
      checkedActions: cleanedCheckedActions,
      departureWindowActive: false,
      ...(clearInventory ? { inventory: {} } : {}),
    });
  },
});
