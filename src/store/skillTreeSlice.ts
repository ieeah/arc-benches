import type { StateCreator } from 'zustand';
import type { AppState, SkillCategory, SkillNode, SkillTreeState } from '@/types';
import skillsData from '@/data/skills.json';
import { bootProfileState } from '@/store/boot';
import {
  calculateSkillBudget,
  canAllocatePoint,
  canDecrementPoint,
  computeShortestPath,
} from '@/lib/skillTree';

const skillNodes = skillsData as SkillNode[];
const nodeMap = new Map<string, SkillNode>(skillNodes.map((n) => [n.id, n]));

export type SkillTreeSlice = SkillTreeState;

export const createSkillTreeSlice: StateCreator<AppState, [], [], SkillTreeSlice> = (
  set,
  get
) => ({
  skillAllocations: bootProfileState.skillAllocations ?? {},
  raiderLevel: bootProfileState.raiderLevel ?? 75,
  useExpeditionBonus: bootProfileState.useExpeditionBonus ?? true,
  sandboxMode: bootProfileState.sandboxMode ?? false,

  allocateSkillPoint: (nodeId: string): boolean => {
    const s = get();
    const budget = calculateSkillBudget(
      s.raiderLevel,
      s.earnedPermanentSkillPoints,
      s.useExpeditionBonus,
      s.sandboxMode,
      s.skillAllocations
    );

    const check = canAllocatePoint(nodeId, s.skillAllocations, budget, nodeMap);
    if (!check.allowed) return false;

    const current = s.skillAllocations[nodeId] || 0;
    set({
      skillAllocations: {
        ...s.skillAllocations,
        [nodeId]: current + 1,
      },
    });
    return true;
  },

  decrementSkillPoint: (nodeId: string): boolean => {
    const s = get();
    const check = canDecrementPoint(nodeId, s.skillAllocations, nodeMap);
    if (!check.allowed) return false;

    const current = s.skillAllocations[nodeId] || 0;
    const nextAllocations = { ...s.skillAllocations };
    if (current <= 1) {
      delete nextAllocations[nodeId];
    } else {
      nextAllocations[nodeId] = current - 1;
    }

    set({ skillAllocations: nextAllocations });
    return true;
  },

  setSkillPoints: (nodeId: string, points: number): boolean => {
    const s = get();
    const current = s.skillAllocations[nodeId] || 0;
    const target = Math.max(0, Math.floor(points));
    if (current === target) return true;

    if (target > current) {
      for (let i = current; i < target; i++) {
        const success = get().allocateSkillPoint(nodeId);
        if (!success) return false;
      }
      return true;
    } else {
      for (let i = current; i > target; i--) {
        const success = get().decrementSkillPoint(nodeId);
        if (!success) return false;
      }
      return true;
    }
  },

  autoAllocatePath: (targetNodeId: string): boolean => {
    const s = get();
    const path = computeShortestPath(targetNodeId, s.skillAllocations, nodeMap);
    if (path.length === 0) return false;

    for (const stepId of path) {
      if ((get().skillAllocations[stepId] || 0) === 0) {
        const ok = get().allocateSkillPoint(stepId);
        if (!ok) return false;
      }
    }
    return true;
  },

  resetSkillTree: (branch?: SkillCategory): void => {
    const s = get();
    if (!branch) {
      set({ skillAllocations: {} });
      return;
    }

    const nextAllocations: Record<string, number> = {};
    for (const [id, pts] of Object.entries(s.skillAllocations)) {
      const node = nodeMap.get(id);
      if (node && node.category !== branch) {
        nextAllocations[id] = pts;
      }
    }
    set({ skillAllocations: nextAllocations });
  },

  setRaiderLevel: (level: number): void => {
    const clamped = Math.max(1, Math.min(75, Math.floor(level)));
    set({ raiderLevel: clamped });
  },

  setUseExpeditionBonus: (use: boolean): void => {
    set({ useExpeditionBonus: use });
  },

  setSandboxMode: (sandbox: boolean): void => {
    set({ sandboxMode: sandbox });
  },
});
