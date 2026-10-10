import type { StateCreator } from 'zustand';
import type { AppState, RewardPassLevelResult } from '@/types';
import { bootProfileState } from '@/store/boot';
import { passes } from '@/store/gameData';
import { isPassAvailable, isPassCompleted, nextActiveAfterCompletion } from '@/lib/rewardPass';

export type RewardPassSlice = Pick<
  AppState,
  | 'passes'
  | 'activeRewardPass'
  | 'completedRewardPasses'
  | 'setActiveRewardPass'
  | 'setRewardPassLevel'
  | 'concludeRewardPass'
  | 'resetRewardPassProgress'
  | 'acknowledgeInactiveRewardPass'
>;

const NOT_COMPLETED: RewardPassLevelResult = { completed: false, choices: [] };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** `currentLevels` senza il progresso del pass indicato. */
const withoutProgress = (levels: Record<string, number>, passId: string): Record<string, number> => {
  const { [passId]: _removed, ...rest } = levels;
  void _removed;
  return rest;
};

/**
 * Reward Pass del profilo: un solo pass attivo, cambiabile in qualsiasi momento. Il livello di ogni pass
 * resta in `currentLevels[passId]`; un pass è completato quando il livello è il massimo (derivato). L'elenco
 * `completedRewardPasses` è l'archivio per profilo (id e data), aggiornato solo da `setRewardPassLevel`.
 */
export const createRewardPassSlice: StateCreator<AppState, [], [], RewardPassSlice> = (set, get) => ({
  passes,
  activeRewardPass: bootProfileState.activeRewardPass ?? null,
  completedRewardPasses: bootProfileState.completedRewardPasses ?? [],

  setActiveRewardPass: (passId, startLevel) => {
    const s = get();
    if (passId === null) {
      set({ activeRewardPass: null });
      return true;
    }
    const pass = s.passes.find(p => p.id === passId);
    if (!pass || !isPassAvailable(pass)) return false;
    const current = s.currentLevels[passId] ?? 0;
    const maxStart = Math.max(0, pass.maxLevel - 1);
    // Un pass completato riparte da maxLevel - 1; altrimenti si conserva il livello (o quello scelto).
    const level = startLevel !== undefined
      ? clamp(Math.floor(startLevel), 0, maxStart)
      : clamp(current, 0, maxStart);
    set({
      activeRewardPass: passId,
      currentLevels: { ...s.currentLevels, [passId]: level },
      completedRewardPasses: s.completedRewardPasses.filter(c => c.id !== passId),
    });
    return true;
  },

  setRewardPassLevel: (level, passId) => {
    const s = get();
    const id = passId ?? s.activeRewardPass;
    const pass = s.passes.find(p => p.id === id);
    if (!pass) return NOT_COMPLETED;

    const clamped = clamp(Math.floor(level), 0, pass.maxLevel);
    const currentLevels = { ...s.currentLevels, [pass.id]: clamped };

    if (clamped < pass.maxLevel) {
      set({ currentLevels, completedRewardPasses: s.completedRewardPasses.filter(c => c.id !== pass.id) });
      return NOT_COMPLETED;
    }

    const completedRewardPasses = s.completedRewardPasses.some(c => c.id === pass.id)
      ? s.completedRewardPasses
      : [...s.completedRewardPasses, { id: pass.id, completedAt: new Date().toISOString() }];

    let activeRewardPass = s.activeRewardPass;
    let choices: string[] = [];
    if (activeRewardPass === pass.id) {
      const next = nextActiveAfterCompletion(s.passes, currentLevels, pass.id);
      activeRewardPass = next.auto;
      choices = next.choices;
    }
    set({ currentLevels, completedRewardPasses, activeRewardPass });
    return { completed: true, choices };
  },

  concludeRewardPass: () => {
    const s = get();
    const pass = s.passes.find(p => p.id === s.activeRewardPass);
    if (!pass) return NOT_COMPLETED;
    return get().setRewardPassLevel(pass.maxLevel, pass.id);
  },

  resetRewardPassProgress: (passId) => {
    const s = get();
    set({
      currentLevels: withoutProgress(s.currentLevels, passId),
      completedRewardPasses: s.completedRewardPasses.filter(c => c.id !== passId),
    });
  },

  acknowledgeInactiveRewardPass: () => {
    const s = get();
    const id = s.activeRewardPass;
    if (id === null) return;
    const pass = s.passes.find(p => p.id === id);
    if (pass && isPassAvailable(pass) && !isPassCompleted(pass, s.currentLevels)) return; // il pass attivo è valido
    set({ activeRewardPass: null });
  },
});
