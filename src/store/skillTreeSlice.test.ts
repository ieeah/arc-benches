import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store';

describe('skillTreeSlice (#62)', () => {
  beforeEach(() => {
    useAppStore.getState().resetSkillTree();
    useAppStore.getState().setExtraSkillPoints(0);
    useAppStore.getState().setSandboxMode(false);
  });

  it('allocates points to root node', () => {
    // mob_3l is the Mobility root node (maxPoints: 1)
    const success = useAppStore.getState().allocateSkillPoint('mob_3l');
    expect(success).toBe(true);
    expect(useAppStore.getState().skillAllocations.mob_3l).toBe(1);
  });

  it('decrements points correctly and cleans up zero values', () => {
    // mob_3l (root, 1 pt) -> mob_1 (tier 2, 5 pts)
    useAppStore.getState().allocateSkillPoint('mob_3l');
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
    useAppStore.getState().allocateSkillPoint('mob_3l');
    useAppStore.getState().allocateSkillPoint('cond_1');

    useAppStore.getState().resetSkillTree('MOBILITY');
    expect(useAppStore.getState().skillAllocations.mob_3l).toBeUndefined();
    expect(useAppStore.getState().skillAllocations.cond_1).toBe(1);

    useAppStore.getState().resetSkillTree();
    expect(useAppStore.getState().skillAllocations).toEqual({});
  });

  it('respects sandbox mode for unlimited allocation', () => {
    useAppStore.getState().setSandboxMode(true);

    // Root node 1 point
    useAppStore.getState().allocateSkillPoint('mob_3l');
    // mob_1 points
    useAppStore.getState().allocateSkillPoint('mob_1');
    const ok2 = useAppStore.getState().allocateSkillPoint('mob_1');
    expect(ok2).toBe(true);
    expect(useAppStore.getState().skillAllocations.mob_1).toBe(2);
  });

  it('auto-allocates path to target node', () => {
    // Target mob_1 requires mob_3l
    const ok = useAppStore.getState().autoAllocatePath('mob_1');
    expect(ok).toBe(true);
    expect(useAppStore.getState().skillAllocations.mob_3l).toBe(1);
    expect(useAppStore.getState().skillAllocations.mob_1).toBe(1);
  });
});
