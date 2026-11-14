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
  const nodeMap = new Map<string, SkillNode>(nodes.map(n => [n.id, n]));

  it('defines the correct gate thresholds as in ARC Raiders Frozen Trail', () => {
    expect(GATE_THRESHOLDS.mid).toBe(10);
    expect(GATE_THRESHOLDS.final1).toBe(30);
    expect(GATE_THRESHOLDS.final2).toBe(40);
  });

  it('calculates points spent in a specific branch and globally', () => {
    const allocations = {
      cond_1: 5,
      cond_2l: 3,
      mob_1: 2,
    };
    expect(calculateBranchSpent('CONDITIONING', allocations, nodeMap)).toBe(8);
    expect(calculateBranchSpent('MOBILITY', allocations, nodeMap)).toBe(2);
    expect(calculateBranchSpent('SURVIVAL', allocations, nodeMap)).toBe(0);
    expect(calculateTotalSpent(allocations)).toBe(10);
  });

  it('allows allocating points to root node without prerequisites', () => {
    const allocations: Record<string, number> = {};
    const budget = { remainingSP: 75, sandboxMode: false };

    expect(canAllocatePoint('mob_1', allocations, budget, nodeMap).allowed).toBe(true);
  });

  it('prevents allocating points to child node if parent has 0 points', () => {
    const allocations: Record<string, number> = {};
    const budget = { remainingSP: 75, sandboxMode: false };

    // mob_2l requires mob_1
    const check = canAllocatePoint('mob_2l', allocations, budget, nodeMap);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('missing_prerequisite');
  });

  it('allows allocating points to child node once parent has at least 1 point', () => {
    const allocations: Record<string, number> = { mob_1: 1 };
    const budget = { remainingSP: 74, sandboxMode: false };

    const check = canAllocatePoint('mob_2l', allocations, budget, nodeMap);
    expect(check.allowed).toBe(true);
  });

  it('respects node maxPoints (on/off at 1 vs incremental at 5)', () => {
    const budget = { remainingSP: 70, sandboxMode: false };

    // cond_1 has maxPoints = 5
    const alloc5: Record<string, number> = { cond_1: 5 };
    expect(canAllocatePoint('cond_1', alloc5, budget, nodeMap).allowed).toBe(false);

    // cond_5c has maxPoints = 1
    const alloc1: Record<string, number> = { cond_5c: 1 };
    expect(canAllocatePoint('cond_5c', alloc1, budget, nodeMap).allowed).toBe(false);
  });

  it('enforces gate thresholds (10 SP for mid milestone, 30 and 40 for final milestones)', () => {
    const budget = { remainingSP: 50, sandboxMode: false };

    // cond_4l is a mid milestone: requires 10 points in Conditioning
    const under10: Record<string, number> = { cond_1: 5, cond_2l: 4 }; // 9 points
    const checkUnder = canAllocatePoint('cond_4l', under10, budget, nodeMap);
    expect(checkUnder.allowed).toBe(false);
    expect(checkUnder.reason).toBe('gate_locked_10');

    // Reach 10 points in Conditioning
    const at10: Record<string, number> = { cond_1: 5, cond_2l: 5, cond_3l: 1 }; // 11 points and prereq cond_3l satisfied
    const checkAt10 = canAllocatePoint('cond_4l', at10, budget, nodeMap);
    expect(checkAt10.allowed).toBe(true);

    // cond_7l is a final milestone: requires 30 points in Conditioning
    const under30: Record<string, number> = { ...at10, cond_4l: 1, cond_5l: 5, cond_6l: 5 }; // 22 points
    const checkUnder30 = canAllocatePoint('cond_7l', under30, budget, nodeMap);
    expect(checkUnder30.allowed).toBe(false);
    expect(checkUnder30.reason).toBe('gate_locked_30');
  });

  it('prevents decrementing points if a child node relies on this node as its sole parent', () => {
    const allocations: Record<string, number> = {
      mob_1: 1,
      mob_2l: 1,
    };

    // mob_1 cannot be decremented to 0 because mob_2l depends on it
    const check = canDecrementPoint('mob_1', allocations, nodeMap);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('has_dependent_children');

    // mob_2l CAN be decremented because no child depends on it
    expect(canDecrementPoint('mob_2l', allocations, nodeMap).allowed).toBe(true);
  });

  it('prevents decrementing points if it causes branch points to drop below gate threshold of active milestone', () => {
    // Exactly 10 points in Conditioning + cond_4l active
    const allocations: Record<string, number> = {
      cond_1: 5,
      cond_2l: 2,
      cond_2r: 2,
      cond_3l: 1, // 5 + 2 + 2 + 1 = 10 points in tiers 1-3
      cond_4l: 1, // active mid milestone
    };

    // If we try to decrement cond_2r from 2 to 1, total pre-gate points would drop to 9 while cond_4l is active
    const check = canDecrementPoint('cond_2r', allocations, nodeMap);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('violates_gate_threshold');
  });

  it('calculates skill budget correctly with raider level and optional expeditions', () => {
    // Normal level 50 without expeditions
    const b1 = calculateSkillBudget(50, 0, false, false, { mob_1: 10 });
    expect(b1.totalAvailableSP).toBe(50);
    expect(b1.totalSpentSP).toBe(10);
    expect(b1.remainingSP).toBe(40);

    // Level 75 with 15 expedition SP
    const b2 = calculateSkillBudget(75, 15, true, false, { mob_1: 10 });
    expect(b2.totalAvailableSP).toBe(90);
    expect(b2.remainingSP).toBe(80);

    // Sandbox mode
    const b3 = calculateSkillBudget(75, 0, false, true, { mob_1: 100 });
    expect(b3.sandboxMode).toBe(true);
    expect(b3.remainingSP).toBe(Infinity);
  });
});
