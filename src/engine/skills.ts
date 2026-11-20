import type { SkillCategory, SkillNode } from '@/types';

export const GATE_THRESHOLDS = {
  mid: 10,
  final1: 30,
  final2: 40,
} as const;

export type SkillBudget = {
  totalAvailableSP: number;
  totalSpentSP: number;
  remainingSP: number;
  sandboxMode: boolean;
};

export type SkillActionCheck = {
  allowed: boolean;
  reason?:
    | 'not_found'
    | 'max_points_reached'
    | 'insufficient_points'
    | 'gate_locked_10'
    | 'gate_locked_30'
    | 'gate_locked_40'
    | 'missing_prerequisite'
    | 'not_allocated'
    | 'has_dependent_children'
    | 'violates_gate_threshold';
};

/**
 * Returns the tier (1-7) of a skill node.
 * Uses node.position.y (y=75 -> T1, y=15 -> T7), minPointsSpent, or node ID naming convention.
 */
export function getNodeTier(nodeId: string, nodeMap?: Map<string, SkillNode>): number {
  if (nodeMap) {
    const node = nodeMap.get(nodeId);
    if (node) {
      if (node.position && typeof node.position.y === 'number') {
        return Math.round((85 - node.position.y) / 10);
      }
      if (node.minPointsSpent === 30 || node.minPointsSpent === 40) return 7;
      if (node.minPointsSpent === 10) return 4;
      if (node.prerequisiteNodeIds.length === 0) return 1;
    }
  }
  const match = nodeId.match(/_(\d)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Calculates the total skill points spent in a given branch.
 */
export function calculateBranchSpent(
  category: SkillCategory,
  allocations: Record<string, number>,
  nodeMap: Map<string, SkillNode>
): number {
  let spent = 0;
  for (const [nodeId, points] of Object.entries(allocations)) {
    if (points > 0) {
      const node = nodeMap.get(nodeId);
      if (node && node.category === category) {
        spent += points;
      }
    }
  }
  return spent;
}

/**
 * Calculates the total skill points spent across all branches.
 */
export function calculateTotalSpent(allocations: Record<string, number>): number {
  return Object.values(allocations).reduce((acc, pts) => acc + (pts > 0 ? pts : 0), 0);
}

export const BASE_SKILL_POINTS = 76;
export const MAX_EXTRA_SKILL_POINTS = 15;

/**
 * Calculates skill points budget based on base points (76) + extra points (0-15),
 * and whether sandbox mode is active.
 */
export function calculateSkillBudget(
  extraSkillPoints: number = 0,
  sandboxMode: boolean = false,
  allocations: Record<string, number> = {}
): SkillBudget {
  const totalSpentSP = calculateTotalSpent(allocations);

  if (sandboxMode) {
    return {
      totalAvailableSP: Infinity,
      totalSpentSP,
      remainingSP: Infinity,
      sandboxMode: true,
    };
  }

  const bonusSP = Math.max(0, Math.min(MAX_EXTRA_SKILL_POINTS, Math.floor(extraSkillPoints || 0)));
  const totalAvailableSP = BASE_SKILL_POINTS + bonusSP;
  const remainingSP = Math.max(0, totalAvailableSP - totalSpentSP);

  return {
    totalAvailableSP,
    totalSpentSP,
    remainingSP,
    sandboxMode: false,
  };
}

/**
 * Checks whether a point can be allocated to a target node.
 */
export function canAllocatePoint(
  nodeId: string,
  allocations: Record<string, number>,
  budget: { remainingSP: number; sandboxMode: boolean },
  nodeMap: Map<string, SkillNode>
): SkillActionCheck {
  const node = nodeMap.get(nodeId);
  if (!node) {
    return { allowed: false, reason: 'not_found' };
  }

  const currentPoints = allocations[nodeId] || 0;
  if (currentPoints >= node.maxPoints) {
    return { allowed: false, reason: 'max_points_reached' };
  }

  if (!budget.sandboxMode && budget.remainingSP <= 0) {
    return { allowed: false, reason: 'insufficient_points' };
  }

  const tier = getNodeTier(nodeId, nodeMap);
  const branchSpent = calculateBranchSpent(node.category, allocations, nodeMap);

  // Check gate thresholds:
  // Tier 4 (mid milestone) requires 10 points spent in branch
  if (tier === 4 && branchSpent < GATE_THRESHOLDS.mid) {
    return { allowed: false, reason: 'gate_locked_10' };
  }

  // Tier 7 (final milestones):
  if (tier === 7) {
    // Count how many tier 7 skills are already allocated in this category
    const allocatedTier7Count = Object.keys(allocations).filter((id) => {
      const n = nodeMap.get(id);
      return (
        n &&
        n.category === node.category &&
        getNodeTier(id, nodeMap) === 7 &&
        (allocations[id] || 0) > 0
      );
    }).length;

    if (allocatedTier7Count === 0) {
      if (branchSpent < GATE_THRESHOLDS.final1) {
        return { allowed: false, reason: 'gate_locked_30' };
      }
    } else {
      if (branchSpent < GATE_THRESHOLDS.final2) {
        return { allowed: false, reason: 'gate_locked_40' };
      }
    }
  }

  // Check prerequisites:
  // Root node has no prerequisites
  if (node.prerequisiteNodeIds.length > 0) {
    // For mid milestone (tier 4), requires its immediate prerequisite in the track
    // For tier 5, requires either mid milestone (tier 4l or 4r)
    // In general, a node requires AT LEAST ONE of its prerequisite nodes to have > 0 points
    const hasAnyPrereqSatisfied = node.prerequisiteNodeIds.some(
      (prereqId) => (allocations[prereqId] || 0) > 0
    );

    if (!hasAnyPrereqSatisfied) {
      return { allowed: false, reason: 'missing_prerequisite' };
    }
  }

  return { allowed: true };
}

/**
 * Verifies if all active nodes in the tree remain connected to root nodes.
 */
function areAllAllocatedNodesConnected(
  allocations: Record<string, number>,
  nodeMap: Map<string, SkillNode>
): boolean {
  const allocatedIds = Object.keys(allocations).filter((id) => (allocations[id] || 0) > 0);
  if (allocatedIds.length === 0) return true;

  const connected = new Set<string>();

  // Roots with points are immediately connected
  for (const id of allocatedIds) {
    const node = nodeMap.get(id);
    if (node && node.prerequisiteNodeIds.length === 0) {
      connected.add(id);
    }
  }

  // Iteratively expand connected set
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of allocatedIds) {
      if (connected.has(id)) continue;
      const node = nodeMap.get(id);
      if (!node) continue;

      const hasConnectedPrereq = node.prerequisiteNodeIds.some(
        (pId) => connected.has(pId) && (allocations[pId] || 0) > 0
      );

      if (hasConnectedPrereq) {
        connected.add(id);
        changed = true;
      }
    }
  }

  // Check if any allocated node is not connected
  return allocatedIds.every((id) => connected.has(id));
}

/**
 * Checks whether a point can be removed from a node without breaking progression integrity.
 */
export function canDecrementPoint(
  nodeId: string,
  allocations: Record<string, number>,
  nodeMap: Map<string, SkillNode>
): SkillActionCheck {
  const currentPoints = allocations[nodeId] || 0;
  if (currentPoints <= 0) {
    return { allowed: false, reason: 'not_allocated' };
  }

  const node = nodeMap.get(nodeId);
  if (!node) {
    return { allowed: false, reason: 'not_found' };
  }

  // Simulate new allocations
  const newAllocations: Record<string, number> = {
    ...allocations,
    [nodeId]: currentPoints - 1,
  };
  if (newAllocations[nodeId] === 0) {
    delete newAllocations[nodeId];
  }

  // 1. Check if DAG connectivity is preserved
  if (!areAllAllocatedNodesConnected(newAllocations, nodeMap)) {
    return { allowed: false, reason: 'has_dependent_children' };
  }

  // 2. Check gate thresholds for the affected branch
  let tiers1To3Spent = 0;
  let tiers1To6Spent = 0;
  let tier4Active = false;
  let tier7Count = 0;

  for (const [id, pts] of Object.entries(newAllocations)) {
    if (pts > 0) {
      const n = nodeMap.get(id);
      if (n && n.category === node.category) {
        const tier = getNodeTier(id, nodeMap);
        if (tier <= 3) {
          tiers1To3Spent += pts;
        }
        if (tier <= 6) {
          tiers1To6Spent += pts;
        }
        if (tier >= 4) {
          tier4Active = true;
        }
        if (tier === 7) {
          tier7Count++;
        }
      }
    }
  }

  // Mid milestone gate: If any tier >= 4 is active, tiers 1-3 must have >= 10 points
  if (tier4Active && tiers1To3Spent < GATE_THRESHOLDS.mid) {
    return { allowed: false, reason: 'violates_gate_threshold' };
  }

  // Final milestone 1 gate: If at least 1 final milestone is active, tiers 1-6 must have >= 30 points
  if (tier7Count >= 1 && tiers1To6Spent < GATE_THRESHOLDS.final1) {
    return { allowed: false, reason: 'violates_gate_threshold' };
  }

  // Final milestone 2 gate: If 2 final milestones are active, total before second milestone must be >= 40 points
  // (tiers 1-6 + 1 pt for milestone 1)
  if (tier7Count >= 2 && tiers1To6Spent + 1 < GATE_THRESHOLDS.final2) {
    return { allowed: false, reason: 'violates_gate_threshold' };
  }

  return { allowed: true };
}

/**
 * Computes the shortest list of node IDs to unlock from current state to reach targetNodeId.
 */
export function computeShortestPath(
  targetNodeId: string,
  allocations: Record<string, number>,
  nodeMap: Map<string, SkillNode>
): string[] {
  const targetNode = nodeMap.get(targetNodeId);
  if (!targetNode) return [];

  // If target already has points, path is empty
  if ((allocations[targetNodeId] || 0) > 0) return [];

  // Breadth-first search back to an already allocated node or root
  const path: string[] = [];
  let current: SkillNode | undefined = targetNode;

  while (current) {
    path.unshift(current.id);
    if (current.prerequisiteNodeIds.length === 0) break;

    // Find first prereq that is already allocated, or choose the first prereq
    const allocatedPrereqId = current.prerequisiteNodeIds.find(
      (pId) => (allocations[pId] || 0) > 0
    );

    if (allocatedPrereqId) {
      break;
    }

    current = nodeMap.get(current.prerequisiteNodeIds[0]);
  }

  return path;
}
