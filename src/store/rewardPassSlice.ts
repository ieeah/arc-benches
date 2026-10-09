import type { StateCreator } from 'zustand';
import type { AppState } from '@/types';
import { bootProfileState } from '@/store/boot';
import { passes } from '@/store/gameData';

export type RewardPassSlice = Pick<
  AppState,
  | 'passes'
  | 'activeRewardPass'
  | 'completedRewardPasses'
  | 'setActiveRewardPass'
  | 'setRewardPassLevel'
  | 'concludeRewardPass'
  | 'resetActiveRewardPass'
  | 'resolveOrphanRewardPass'
>;

/** `currentLevels` senza il progresso del pass indicato. */
const withoutProgress = (levels: Record<string, number>, passId: string): Record<string, number> => {
  const { [passId]: _removed, ...rest } = levels;
  void _removed;
  return rest;
};

/**
 * Reward Pass del profilo: al massimo un pass attivo alla volta, che cambia solo concludendolo
 * (o, per correggere un errore, dalle Impostazioni, perdendo il progresso). Il tier raggiunto
 * riusa `currentLevels[passId]`. Lo storico dei pass conclusi conserva il nome del pass.
 */
export const createRewardPassSlice: StateCreator<AppState, [], [], RewardPassSlice> = (set, get) => ({
  passes,
  activeRewardPass: bootProfileState.activeRewardPass ?? null,
  completedRewardPasses: bootProfileState.completedRewardPasses ?? [],

  setActiveRewardPass: (passId) => {
    const s = get();
    if (s.activeRewardPass !== null) return false;
    if (!s.passes.some(p => p.id === passId)) return false;
    if (s.completedRewardPasses.some(c => c.id === passId)) return false;
    set({ activeRewardPass: passId, currentLevels: { ...s.currentLevels, [passId]: 0 } });
    return true;
  },

  setRewardPassLevel: (level) => {
    const s = get();
    const pass = s.passes.find(p => p.id === s.activeRewardPass);
    if (!pass) return;
    const clamped = Math.max(0, Math.min(pass.maxLevel, Math.floor(level)));
    set({ currentLevels: { ...s.currentLevels, [pass.id]: clamped } });
  },

  concludeRewardPass: () => {
    const s = get();
    const pass = s.passes.find(p => p.id === s.activeRewardPass);
    if (!pass) return;
    set({
      activeRewardPass: null,
      currentLevels: { ...s.currentLevels, [pass.id]: pass.maxLevel },
      completedRewardPasses: [
        ...s.completedRewardPasses.filter(c => c.id !== pass.id),
        { id: pass.id, name: pass.name, completedAt: new Date().toISOString() },
      ],
    });
  },

  resetActiveRewardPass: () => {
    const s = get();
    if (s.activeRewardPass === null) return;
    set({ activeRewardPass: null, currentLevels: withoutProgress(s.currentLevels, s.activeRewardPass) });
  },

  resolveOrphanRewardPass: (outcome) => {
    const s = get();
    const id = s.activeRewardPass;
    if (id === null || s.passes.some(p => p.id === id)) return; // nessun pass orfano
    if (outcome === 'completed') {
      set({
        activeRewardPass: null,
        completedRewardPasses: [
          ...s.completedRewardPasses.filter(c => c.id !== id),
          { id, name: id, completedAt: new Date().toISOString() },
        ],
      });
    } else {
      set({ activeRewardPass: null, currentLevels: withoutProgress(s.currentLevels, id) });
    }
  },
});
