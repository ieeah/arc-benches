import { BRANCH_CONFIGS, type BranchVisualConfig, type CalculatedNodePos } from './types';
import type { SkillCategory } from '@/types';

export type SkillConnection = {
  id: string;
  category: SkillCategory;
  fromNodeId?: string;
  toNodeId: string;
  path: string;
};

export function computeBranchNodes(config: BranchVisualConfig): Record<string, CalculatedNodePos> {
  const { category, angleDeg, origin } = config;
  const rad = (angleDeg * Math.PI) / 180;
  const dir = { x: Math.cos(rad), y: Math.sin(rad) };
  const perp = { x: -Math.sin(rad), y: Math.cos(rad) };
  const step = 110;
  const prefix = category === 'CONDITIONING' ? 'cond' : category === 'MOBILITY' ? 'mob' : 'surv';

  const at = (s: number, lateralOffset: number) => ({
    x: Math.round(origin.x + dir.x * s + perp.x * lateralOffset),
    y: Math.round(origin.y + dir.y * s + perp.y * lateralOffset),
  });

  const slots: Record<string, CalculatedNodePos> = {
    [`${prefix}_1`]: {
      id: `${prefix}_1`,
      ...at(0, 0),
      category,
      tier: 1,
      isMilestone: false,
    },
    [`${prefix}_2l`]: {
      id: `${prefix}_2l`,
      ...at(step, -65),
      category,
      tier: 2,
      isMilestone: false,
    },
    [`${prefix}_2r`]: {
      id: `${prefix}_2r`,
      ...at(step, 65),
      category,
      tier: 2,
      isMilestone: false,
    },
    [`${prefix}_3l`]: {
      id: `${prefix}_3l`,
      ...at(step * 2, -65),
      category,
      tier: 3,
      isMilestone: false,
    },
    [`${prefix}_3r`]: {
      id: `${prefix}_3r`,
      ...at(step * 2, 65),
      category,
      tier: 3,
      isMilestone: false,
    },
    // Tier 4 is a single physical mid milestone slot housing 4l and 4r
    [`${prefix}_4`]: {
      id: `${prefix}_4`,
      ...at(step * 3, 0),
      category,
      tier: 4,
      isMilestone: true,
    },
    [`${prefix}_5l`]: {
      id: `${prefix}_5l`,
      ...at(step * 4, -90),
      category,
      tier: 5,
      isMilestone: false,
    },
    [`${prefix}_5c`]: {
      id: `${prefix}_5c`,
      ...at(step * 4, 0),
      category,
      tier: 5,
      isMilestone: false,
    },
    [`${prefix}_5r`]: {
      id: `${prefix}_5r`,
      ...at(step * 4, 90),
      category,
      tier: 5,
      isMilestone: false,
    },
    [`${prefix}_6l`]: {
      id: `${prefix}_6l`,
      ...at(step * 5, -90),
      category,
      tier: 6,
      isMilestone: false,
    },
    [`${prefix}_6c`]: {
      id: `${prefix}_6c`,
      ...at(step * 5, 0),
      category,
      tier: 6,
      isMilestone: false,
    },
    [`${prefix}_6r`]: {
      id: `${prefix}_6r`,
      ...at(step * 5, 90),
      category,
      tier: 6,
      isMilestone: false,
    },
    [`${prefix}_7l`]: {
      id: `${prefix}_7l`,
      ...at(step * 6, -55),
      category,
      tier: 7,
      isMilestone: true,
    },
    [`${prefix}_7r`]: {
      id: `${prefix}_7r`,
      ...at(step * 6, 55),
      category,
      tier: 7,
      isMilestone: true,
    },
  };

  return slots;
}

export function computeAllNodePositions(): Record<string, CalculatedNodePos> {
  const condNodes = computeBranchNodes(BRANCH_CONFIGS.CONDITIONING);
  const mobNodes = computeBranchNodes(BRANCH_CONFIGS.MOBILITY);
  const survNodes = computeBranchNodes(BRANCH_CONFIGS.SURVIVAL);

  return {
    ...condNodes,
    ...mobNodes,
    ...survNodes,
  };
}

export function computeBranchConnections(config: BranchVisualConfig): SkillConnection[] {
  const nodes = computeBranchNodes(config);
  const { category } = config;
  const prefix = category === 'CONDITIONING' ? 'cond' : category === 'MOBILITY' ? 'mob' : 'surv';

  const n1 = nodes[`${prefix}_1`];
  const n2l = nodes[`${prefix}_2l`];
  const n2r = nodes[`${prefix}_2r`];
  const n3l = nodes[`${prefix}_3l`];
  const n3r = nodes[`${prefix}_3r`];
  const n4 = nodes[`${prefix}_4`];
  const n5l = nodes[`${prefix}_5l`];
  const n5c = nodes[`${prefix}_5c`];
  const n5r = nodes[`${prefix}_5r`];
  const n6l = nodes[`${prefix}_6l`];
  const n6c = nodes[`${prefix}_6c`];
  const n6r = nodes[`${prefix}_6r`];
  const n7l = nodes[`${prefix}_7l`];
  const n7r = nodes[`${prefix}_7r`];

  const connections: SkillConnection[] = [
    // Root to tier 2
    {
      id: `${prefix}_conn_1_2l`,
      category,
      fromNodeId: `${prefix}_1`,
      toNodeId: `${prefix}_2l`,
      path: `M ${n1.x} ${n1.y} Q ${(n1.x + n2l.x) / 2} ${(n1.y + n2l.y) / 2 + 10} ${n2l.x} ${n2l.y}`,
    },
    {
      id: `${prefix}_conn_1_2r`,
      category,
      fromNodeId: `${prefix}_1`,
      toNodeId: `${prefix}_2r`,
      path: `M ${n1.x} ${n1.y} Q ${(n1.x + n2r.x) / 2} ${(n1.y + n2r.y) / 2 + 10} ${n2r.x} ${n2r.y}`,
    },
    // Tier 2 to tier 3
    {
      id: `${prefix}_conn_2l_3l`,
      category,
      fromNodeId: `${prefix}_2l`,
      toNodeId: `${prefix}_3l`,
      path: `M ${n2l.x} ${n2l.y} L ${n3l.x} ${n3l.y}`,
    },
    {
      id: `${prefix}_conn_2r_3r`,
      category,
      fromNodeId: `${prefix}_2r`,
      toNodeId: `${prefix}_3r`,
      path: `M ${n2r.x} ${n2r.y} L ${n3r.x} ${n3r.y}`,
    },
    // Tier 3 to mid milestone
    {
      id: `${prefix}_conn_3l_4`,
      category,
      fromNodeId: `${prefix}_3l`,
      toNodeId: `${prefix}_4`,
      path: `M ${n3l.x} ${n3l.y} Q ${(n3l.x + n4.x) / 2} ${(n3l.y + n4.y) / 2} ${n4.x} ${n4.y}`,
    },
    {
      id: `${prefix}_conn_3r_4`,
      category,
      fromNodeId: `${prefix}_3r`,
      toNodeId: `${prefix}_4`,
      path: `M ${n3r.x} ${n3r.y} Q ${(n3r.x + n4.x) / 2} ${(n3r.y + n4.y) / 2} ${n4.x} ${n4.y}`,
    },
    // Mid milestone to tier 5
    {
      id: `${prefix}_conn_4_5l`,
      category,
      fromNodeId: `${prefix}_4`,
      toNodeId: `${prefix}_5l`,
      path: `M ${n4.x} ${n4.y} Q ${(n4.x + n5l.x) / 2} ${(n4.y + n5l.y) / 2} ${n5l.x} ${n5l.y}`,
    },
    {
      id: `${prefix}_conn_4_5c`,
      category,
      fromNodeId: `${prefix}_4`,
      toNodeId: `${prefix}_5c`,
      path: `M ${n4.x} ${n4.y} L ${n5c.x} ${n5c.y}`,
    },
    {
      id: `${prefix}_conn_4_5r`,
      category,
      fromNodeId: `${prefix}_4`,
      toNodeId: `${prefix}_5r`,
      path: `M ${n4.x} ${n4.y} Q ${(n4.x + n5r.x) / 2} ${(n4.y + n5r.y) / 2} ${n5r.x} ${n5r.y}`,
    },
    // Tier 5 to tier 6
    {
      id: `${prefix}_conn_5l_6l`,
      category,
      fromNodeId: `${prefix}_5l`,
      toNodeId: `${prefix}_6l`,
      path: `M ${n5l.x} ${n5l.y} L ${n6l.x} ${n6l.y}`,
    },
    {
      id: `${prefix}_conn_5c_6c`,
      category,
      fromNodeId: `${prefix}_5c`,
      toNodeId: `${prefix}_6c`,
      path: `M ${n5c.x} ${n5c.y} L ${n6c.x} ${n6c.y}`,
    },
    {
      id: `${prefix}_conn_5r_6r`,
      category,
      fromNodeId: `${prefix}_5r`,
      toNodeId: `${prefix}_6r`,
      path: `M ${n5r.x} ${n5r.y} L ${n6r.x} ${n6r.y}`,
    },
    // Tier 6 to apex crossbar and stem to tier 7
    {
      id: `${prefix}_conn_6_7l`,
      category,
      fromNodeId: `${prefix}_6l`,
      toNodeId: `${prefix}_7l`,
      path: `M ${n6l.x} ${n6l.y} Q ${(n6l.x + n7l.x) / 2} ${(n6l.y + n7l.y) / 2} ${n7l.x} ${n7l.y}`,
    },
    {
      id: `${prefix}_conn_6_7r`,
      category,
      fromNodeId: `${prefix}_6r`,
      toNodeId: `${prefix}_7r`,
      path: `M ${n6r.x} ${n6r.y} Q ${(n6r.x + n7r.x) / 2} ${(n6r.y + n7r.y) / 2} ${n7r.x} ${n7r.y}`,
    },
    {
      id: `${prefix}_conn_6c_apex`,
      category,
      fromNodeId: `${prefix}_6c`,
      toNodeId: `${prefix}_7l`,
      path: `M ${n6c.x} ${n6c.y} L ${(n7l.x + n7r.x) / 2} ${(n7l.y + n7r.y) / 2 + 25}`,
    },
  ];

  return connections;
}
