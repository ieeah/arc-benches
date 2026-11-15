import { describe, it, expect } from 'vitest';
import skillsData from '@/data/skills.json';
import type { SkillNode } from '@/types';
import {
  calculateBranchSpent,
  calculateTotalSpent,
  canAllocatePoint,
  canDecrementPoint,
  calculateSkillBudget,
  GATE_THRESHOLDS,
} from './skillTree';

describe('Skill Tree Engine (Issue #62)', () => {
  const nodes = skillsData as SkillNode[];
  const nodeMap = new Map<string, SkillNode>(nodes.map((n) => [n.id, n]));

  it('defines the correct gate thresholds as in ARC Raiders Frozen Trail', () => {
    expect(GATE_THRESHOLDS.mid).toBe(10);
    expect(GATE_THRESHOLDS.final1).toBe(30);
    expect(GATE_THRESHOLDS.final2).toBe(40);
  });

  it('calculates points spent in a specific branch and globally', () => {
    const allocations = {
      cond_1: 1, // Conditioning root
      surv_6r: 3, // Conditioning tier 2
      mob_3l: 2, // Mobility root
    };
    expect(calculateBranchSpent('CONDITIONING', allocations, nodeMap)).toBe(4);
    expect(calculateBranchSpent('MOBILITY', allocations, nodeMap)).toBe(2);
    expect(calculateBranchSpent('SURVIVAL', allocations, nodeMap)).toBe(0);
    expect(calculateTotalSpent(allocations)).toBe(6);
  });

  it('allows allocating points to root node without prerequisites', () => {
    const allocations: Record<string, number> = {};
    const budget = { remainingSP: 75, sandboxMode: false };

    // mob_3l is the Mobility root node
    expect(canAllocatePoint('mob_3l', allocations, budget, nodeMap).allowed).toBe(true);
  });

  it('prevents allocating points to child node if parent has 0 points', () => {
    const allocations: Record<string, number> = {};
    const budget = { remainingSP: 75, sandboxMode: false };

    // mob_1 requires root mob_3l
    const check = canAllocatePoint('mob_1', allocations, budget, nodeMap);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('missing_prerequisite');
  });

  it('allows allocating points to child node once parent has at least 1 point', () => {
    const allocations: Record<string, number> = { mob_3l: 1 };
    const budget = { remainingSP: 74, sandboxMode: false };

    const check = canAllocatePoint('mob_1', allocations, budget, nodeMap);
    expect(check.allowed).toBe(true);
  });

  it('respects node maxPoints (on/off at 1 vs incremental at 5)', () => {
    const budget = { remainingSP: 70, sandboxMode: false };

    // cond_1 has maxPoints = 1
    const alloc1: Record<string, number> = { cond_1: 1 };
    expect(canAllocatePoint('cond_1', alloc1, budget, nodeMap).allowed).toBe(false);

    // surv_6r has maxPoints = 5
    const alloc5: Record<string, number> = { cond_1: 1, surv_6r: 5 };
    expect(canAllocatePoint('surv_6r', alloc5, budget, nodeMap).allowed).toBe(false);
  });

  it('enforces gate thresholds (10 SP for mid milestone, 30 and 40 for final milestones)', () => {
    const budget = { remainingSP: 50, sandboxMode: false };

    // cond_7l is Conditioning mid milestone: requires 10 points in Conditioning
    const under10: Record<string, number> = { cond_1: 1, surv_6r: 4, mob_6c: 1 }; // 6 points
    const checkUnder = canAllocatePoint('cond_7l', under10, budget, nodeMap);
    expect(checkUnder.allowed).toBe(false);
    expect(checkUnder.reason).toBe('gate_locked_10');

    // Reach 10 points in Conditioning
    const at10: Record<string, number> = {
      cond_1: 1,
      surv_6r: 5,
      surv_5r: 2,
      mob_6c: 2, // 1 + 5 + 2 + 2 = 10 points and prereq mob_6c satisfied
    };
    const checkAt10 = canAllocatePoint('cond_7l', at10, budget, nodeMap);
    expect(checkAt10.allowed).toBe(true);

    // surv_7l is Conditioning final milestone (Scassinamento sicuro): requires 30 points in Conditioning
    const under30: Record<string, number> = { ...at10, cond_7l: 1, cond_5l: 5, mob_5c: 5 }; // 21 points
    const checkUnder30 = canAllocatePoint('surv_7l', under30, budget, nodeMap);
    expect(checkUnder30.allowed).toBe(false);
    expect(checkUnder30.reason).toBe('gate_locked_30');
  });

  it('prevents decrementing points if a child node relies on this node as its sole parent', () => {
    const allocations: Record<string, number> = {
      mob_3l: 1, // root
      mob_1: 1, // child of mob_3l
    };

    // mob_3l cannot be decremented to 0 because mob_1 depends on it
    const check = canDecrementPoint('mob_3l', allocations, nodeMap);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('has_dependent_children');

    // mob_1 CAN be decremented because no child depends on it
    expect(canDecrementPoint('mob_1', allocations, nodeMap).allowed).toBe(true);
  });

  it('prevents decrementing points if it causes branch points to drop below gate threshold of active milestone', () => {
    // Exactly 10 points in Conditioning + cond_7l active
    const allocations: Record<string, number> = {
      cond_1: 1,
      surv_6r: 5,
      surv_5r: 2,
      mob_6c: 2, // 1 + 5 + 2 + 2 = 10 points in tiers 1-3
      cond_7l: 1, // active mid milestone
    };

    // If we try to decrement surv_5r from 2 to 1, total pre-gate points would drop to 9 while cond_7l is active
    const check = canDecrementPoint('surv_5r', allocations, nodeMap);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('violates_gate_threshold');
  });

  it('calculates skill budget correctly with 76 base points and extra points', () => {
    // Base 76 points with 0 extra points
    const b1 = calculateSkillBudget(0, false, { mob_3l: 1 });
    expect(b1.totalAvailableSP).toBe(76);
    expect(b1.totalSpentSP).toBe(1);
    expect(b1.remainingSP).toBe(75);

    // 76 base + 15 extra points
    const b2 = calculateSkillBudget(15, false, { mob_3l: 1 });
    expect(b2.totalAvailableSP).toBe(91);
    expect(b2.remainingSP).toBe(90);

    // Sandbox mode
    const b3 = calculateSkillBudget(0, true, { mob_3l: 100 });
    expect(b3.sandboxMode).toBe(true);
    expect(b3.remainingSP).toBe(Infinity);
  });
});
