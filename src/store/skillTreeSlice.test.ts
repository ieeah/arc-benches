import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store';

describe('skillTreeSlice (#62)', () => {
  beforeEach(() => {
    useAppStore.getState().resetSkillTree();
    useAppStore.getState().setRaiderLevel(75);
    useAppStore.getState().setSandboxMode(false);
    useAppStore.getState().setUseExpeditionBonus(true);
  });

  it('allocates points to root node', () => {
    const success = useAppStore.getState().allocateSkillPoint('mob_1');
    expect(success).toBe(true);
    expect(useAppStore.getState().skillAllocations.mob_1).toBe(1);
  });

  it('decrements points correctly and cleans up zero values', () => {
    useAppStore.getState().allocateSkillPoint('mob_1');
    useAppStore.getState().allocateSkillPoint('mob_1');
    expect(useAppStore.getState().skillAllocations.mob_1).toBe(2);

    const dec1 = useAppStore.getState().decrementSkillPoint('mob_1');
    expect(dec1).toBe(true);
    expect(useAppStore.getState().skillAllocations.mob_1).toBe(1);

    const dec2 = useAppStore.getState().decrementSkillPoint('mob_1');
    expect(dec2).toBe(true);
    expect(useAppStore.getState().skillAllocations.mob_1).toBeUndefined();
  });

  it('resets skill tree completely or by branch', () => {
    useAppStore.getState().allocateSkillPoint('mob_1');
    useAppStore.getState().allocateSkillPoint('cond_1');

    useAppStore.getState().resetSkillTree('MOBILITY');
    expect(useAppStore.getState().skillAllocations.mob_1).toBeUndefined();
    expect(useAppStore.getState().skillAllocations.cond_1).toBe(1);

    useAppStore.getState().resetSkillTree();
    expect(useAppStore.getState().skillAllocations).toEqual({});
  });

  it('respects sandbox mode for unlimited allocation', () => {
    useAppStore.getState().setRaiderLevel(1); // 1 SP
    useAppStore.getState().setSandboxMode(true);

    useAppStore.getState().allocateSkillPoint('mob_1');
    const ok2 = useAppStore.getState().allocateSkillPoint('mob_1');
    expect(ok2).toBe(true);
    expect(useAppStore.getState().skillAllocations.mob_1).toBe(2);
  });

  it('auto-allocates path to target node', () => {
    // Target mob_2l requires mob_1
    const ok = useAppStore.getState().autoAllocatePath('mob_2l');
    expect(ok).toBe(true);
    expect(useAppStore.getState().skillAllocations.mob_1).toBe(1);
    expect(useAppStore.getState().skillAllocations.mob_2l).toBe(1);
  });
});
