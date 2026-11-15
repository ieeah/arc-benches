import { BRANCH_CONFIGS, type BranchVisualConfig, type CalculatedNodePos } from './types';
import type { SkillCategory } from '@/types';

export type SkillConnection = {
  id: string;
  category: SkillCategory;
  fromNodeId?: string;
  toNodeId: string;
  path: string;
};

export type SlotDefinition = {
  slotId: string;
  category: SkillCategory;
  tier: number;
  isMilestone: boolean;
  primaryNodeId?: string;
  choiceNodeIds?: string[];
  minPointsSpent?: number;
};

export const SLOT_DEFINITIONS: Record<string, SlotDefinition> = {
  // Conditioning Branch
  cond_1: {
    slotId: 'cond_1',
    category: 'CONDITIONING',
    tier: 1,
    isMilestone: false,
    primaryNodeId: 'cond_1',
  },
  cond_2l: {
    slotId: 'cond_2l',
    category: 'CONDITIONING',
    tier: 2,
    isMilestone: false,
    primaryNodeId: 'surv_6r',
  },
  cond_2r: {
    slotId: 'cond_2r',
    category: 'CONDITIONING',
    tier: 2,
    isMilestone: false,
    primaryNodeId: 'surv_5r',
  },
  cond_3l: {
    slotId: 'cond_3l',
    category: 'CONDITIONING',
    tier: 3,
    isMilestone: false,
    primaryNodeId: 'mob_6c',
  },
  cond_3r: {
    slotId: 'cond_3r',
    category: 'CONDITIONING',
    tier: 3,
    isMilestone: false,
    primaryNodeId: 'cond_vault_n_carry',
  },
  cond_4: {
    slotId: 'cond_4',
    category: 'CONDITIONING',
    tier: 4,
    isMilestone: true,
    choiceNodeIds: ['cond_7l', 'cond_mules_gallop'],
    minPointsSpent: 10,
  },
  cond_5l: {
    slotId: 'cond_5l',
    category: 'CONDITIONING',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'cond_5l',
  },
  cond_5c: {
    slotId: 'cond_5c',
    category: 'CONDITIONING',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'surv_5l',
  },
  cond_5r: {
    slotId: 'cond_5r',
    category: 'CONDITIONING',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'cond_6c',
  },
  cond_6l: {
    slotId: 'cond_6l',
    category: 'CONDITIONING',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'mob_5c',
  },
  cond_6c: {
    slotId: 'cond_6c',
    category: 'CONDITIONING',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'cond_speedy_mule',
  },
  cond_6r: {
    slotId: 'cond_6r',
    category: 'CONDITIONING',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'cond_3r',
  },
  cond_7l: {
    slotId: 'cond_7l',
    category: 'CONDITIONING',
    tier: 7,
    isMilestone: true,
    choiceNodeIds: ['surv_7l', 'cond_weapon_bash', 'cond_bull_rush'],
    minPointsSpent: 30,
  },
  cond_7r: {
    slotId: 'cond_7r',
    category: 'CONDITIONING',
    tier: 7,
    isMilestone: true,
    choiceNodeIds: ['surv_7l', 'cond_weapon_bash', 'cond_bull_rush'],
    minPointsSpent: 40,
  },

  // Mobility Branch
  mob_1: {
    slotId: 'mob_1',
    category: 'MOBILITY',
    tier: 1,
    isMilestone: false,
    primaryNodeId: 'mob_3l',
  },
  mob_2l: {
    slotId: 'mob_2l',
    category: 'MOBILITY',
    tier: 2,
    isMilestone: false,
    primaryNodeId: 'mob_sure_footed_scrambler',
  },
  mob_2r: {
    slotId: 'mob_2r',
    category: 'MOBILITY',
    tier: 2,
    isMilestone: false,
    primaryNodeId: 'mob_1',
  },
  mob_3l: {
    slotId: 'mob_3l',
    category: 'MOBILITY',
    tier: 3,
    isMilestone: false,
    primaryNodeId: 'mob_6r',
  },
  mob_3r: {
    slotId: 'mob_3r',
    category: 'MOBILITY',
    tier: 3,
    isMilestone: false,
    primaryNodeId: 'cond_3l',
  },
  mob_4: {
    slotId: 'mob_4',
    category: 'MOBILITY',
    tier: 4,
    isMilestone: true,
    choiceNodeIds: ['mob_7r', 'mob_7l'],
    minPointsSpent: 10,
  },
  mob_5l: {
    slotId: 'mob_5l',
    category: 'MOBILITY',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'mob_5l',
  },
  mob_5c: {
    slotId: 'mob_5c',
    category: 'MOBILITY',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'mob_right_back_at_it',
  },
  mob_5r: {
    slotId: 'mob_5r',
    category: 'MOBILITY',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'mob_2l',
  },
  mob_6l: {
    slotId: 'mob_6l',
    category: 'MOBILITY',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'mob_2r',
  },
  mob_6c: {
    slotId: 'mob_6c',
    category: 'MOBILITY',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'mob_5r',
  },
  mob_6r: {
    slotId: 'mob_6r',
    category: 'MOBILITY',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'mob_swift_start',
  },
  mob_7l: {
    slotId: 'mob_7l',
    category: 'MOBILITY',
    tier: 7,
    isMilestone: true,
    choiceNodeIds: ['mob_wall_run', 'mob_in_the_flow', 'mob_sprinting_on_fumes'],
    minPointsSpent: 30,
  },
  mob_7r: {
    slotId: 'mob_7r',
    category: 'MOBILITY',
    tier: 7,
    isMilestone: true,
    choiceNodeIds: ['mob_wall_run', 'mob_in_the_flow', 'mob_sprinting_on_fumes'],
    minPointsSpent: 40,
  },

  // Survival Branch
  surv_1: {
    slotId: 'surv_1',
    category: 'SURVIVAL',
    tier: 1,
    isMilestone: false,
    primaryNodeId: 'surv_3r',
  },
  surv_2l: {
    slotId: 'surv_2l',
    category: 'SURVIVAL',
    tier: 2,
    isMilestone: false,
    primaryNodeId: 'surv_2l',
  },
  surv_2r: {
    slotId: 'surv_2r',
    category: 'SURVIVAL',
    tier: 2,
    isMilestone: false,
    primaryNodeId: 'mob_3r',
  },
  surv_3l: {
    slotId: 'surv_3l',
    category: 'SURVIVAL',
    tier: 3,
    isMilestone: false,
    primaryNodeId: 'surv_3l',
  },
  surv_3r: {
    slotId: 'surv_3r',
    category: 'SURVIVAL',
    tier: 3,
    isMilestone: false,
    primaryNodeId: 'surv_1',
  },
  surv_4: {
    slotId: 'surv_4',
    category: 'SURVIVAL',
    tier: 4,
    isMilestone: true,
    choiceNodeIds: ['surv_7r', 'surv_quick_roll'],
    minPointsSpent: 10,
  },
  surv_5l: {
    slotId: 'surv_5l',
    category: 'SURVIVAL',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'cond_2r',
  },
  surv_5c: {
    slotId: 'surv_5c',
    category: 'SURVIVAL',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'surv_5c',
  },
  surv_5r: {
    slotId: 'surv_5r',
    category: 'SURVIVAL',
    tier: 5,
    isMilestone: false,
    primaryNodeId: 'surv_stylish_landing',
  },
  surv_6l: {
    slotId: 'surv_6l',
    category: 'SURVIVAL',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'cond_5c',
  },
  surv_6c: {
    slotId: 'surv_6c',
    category: 'SURVIVAL',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'surv_6l',
  },
  surv_6r: {
    slotId: 'surv_6r',
    category: 'SURVIVAL',
    tier: 6,
    isMilestone: false,
    primaryNodeId: 'cond_6l',
  },
  surv_7l: {
    slotId: 'surv_7l',
    category: 'SURVIVAL',
    tier: 7,
    isMilestone: true,
    choiceNodeIds: ['surv_nomadic_crafting', 'surv_road_warrior', 'surv_field_repair'],
    minPointsSpent: 30,
  },
  surv_7r: {
    slotId: 'surv_7r',
    category: 'SURVIVAL',
    tier: 7,
    isMilestone: true,
    choiceNodeIds: ['surv_nomadic_crafting', 'surv_road_warrior', 'surv_field_repair'],
    minPointsSpent: 40,
  },
};

export function computeBranchNodes(config: BranchVisualConfig): Record<string, CalculatedNodePos> {
  const { category, angleDeg, origin } = config;
  const rad = (angleDeg * Math.PI) / 180;
  const dir = { x: Math.cos(rad), y: Math.sin(rad) };
  const perp = { x: -Math.sin(rad), y: Math.cos(rad) };
  const prefix = category === 'CONDITIONING' ? 'cond' : category === 'MOBILITY' ? 'mob' : 'surv';

  const at = (s: number, lateralOffset: number) => ({
    x: Math.round(origin.x + dir.x * s + perp.x * lateralOffset),
    y: Math.round(origin.y + dir.y * s + perp.y * lateralOffset),
  });

  const sT2 = 90;
  const sT3 = 180;
  const sT4 = 270;
  const sT5 = 370;
  const sT6 = 470;
  const latT2 = 70;
  const latT5 = 80;

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
      ...at(sT2, -latT2),
      category,
      tier: 2,
      isMilestone: false,
    },
    [`${prefix}_2r`]: {
      id: `${prefix}_2r`,
      ...at(sT2, latT2),
      category,
      tier: 2,
      isMilestone: false,
    },
    [`${prefix}_3l`]: {
      id: `${prefix}_3l`,
      ...at(sT3, -latT2),
      category,
      tier: 3,
      isMilestone: false,
    },
    [`${prefix}_3r`]: {
      id: `${prefix}_3r`,
      ...at(sT3, latT2),
      category,
      tier: 3,
      isMilestone: false,
    },
    // Tier 4 is a single physical mid milestone slot housing the 2 choices
    [`${prefix}_4`]: {
      id: `${prefix}_4`,
      ...at(sT4, 0),
      category,
      tier: 4,
      isMilestone: true,
    },
    [`${prefix}_5l`]: {
      id: `${prefix}_5l`,
      ...at(sT5, -latT5),
      category,
      tier: 5,
      isMilestone: false,
    },
    [`${prefix}_5c`]: {
      id: `${prefix}_5c`,
      ...at(sT5, 0),
      category,
      tier: 5,
      isMilestone: false,
    },
    [`${prefix}_5r`]: {
      id: `${prefix}_5r`,
      ...at(sT5, latT5),
      category,
      tier: 5,
      isMilestone: false,
    },
    [`${prefix}_6l`]: {
      id: `${prefix}_6l`,
      ...at(sT6, -latT5),
      category,
      tier: 6,
      isMilestone: false,
    },
    [`${prefix}_6c`]: {
      id: `${prefix}_6c`,
      ...at(sT6, 0),
      category,
      tier: 6,
      isMilestone: false,
    },
    [`${prefix}_6r`]: {
      id: `${prefix}_6r`,
      ...at(sT6, latT5),
      category,
      tier: 6,
      isMilestone: false,
    },
    // Tier 7 apex milestone diamonds (symmetrical horizontally in Mob, and orthogonal in lateral branches)
    [`${prefix}_7l`]: {
      id: `${prefix}_7l`,
      ...at(sT6 + 95, -50),
      category,
      tier: 7,
      isMilestone: true,
    },
    [`${prefix}_7r`]: {
      id: `${prefix}_7r`,
      ...at(sT6 + 95, 50),
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
  const { category, angleDeg, origin } = config;
  const prefix = category === 'CONDITIONING' ? 'cond' : category === 'MOBILITY' ? 'mob' : 'surv';

  const rad = (angleDeg * Math.PI) / 180;
  const dir = { x: Math.cos(rad), y: Math.sin(rad) };
  const perp = { x: -Math.sin(rad), y: Math.cos(rad) };

  const at = (s: number, lateralOffset: number) => ({
    x: Math.round(origin.x + dir.x * s + perp.x * lateralOffset),
    y: Math.round(origin.y + dir.y * s + perp.y * lateralOffset),
  });

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

  const sT4 = 270;
  const sT6 = 470;
  const latT5 = 80;

  // Split junction between Tier 4 and Tier 5
  const sSplit = sT4 + 35;
  const splitCenter = at(sSplit, 0);
  const splitLeft = at(sSplit, -latT5);
  const splitRight = at(sSplit, latT5);

  // Apex capping crossbar coordinates
  const sCap = sT6 + 35;
  const capLeft = at(sCap, -latT5);
  const capCenter = at(sCap, 0);
  const capRight = at(sCap, latT5);

  // Apex stem fork
  const sFork = sT6 + 95;
  const stemApex = at(sFork, 0);

  const connections: SkillConnection[] = [
    // Root to tier 2 (graceful curves)
    {
      id: `${prefix}_conn_1_2l`,
      category,
      fromNodeId: `${prefix}_1`,
      toNodeId: `${prefix}_2l`,
      path: `M ${n1.x} ${n1.y} C ${(n1.x * 2 + n2l.x) / 3} ${(n1.y * 2 + n2l.y) / 3}, ${(n1.x + n2l.x * 2) / 3} ${(n1.y + n2l.y * 2) / 3}, ${n2l.x} ${n2l.y}`,
    },
    {
      id: `${prefix}_conn_1_2r`,
      category,
      fromNodeId: `${prefix}_1`,
      toNodeId: `${prefix}_2r`,
      path: `M ${n1.x} ${n1.y} C ${(n1.x * 2 + n2r.x) / 3} ${(n1.y * 2 + n2r.y) / 3}, ${(n1.x + n2r.x * 2) / 3} ${(n1.y + n2r.y * 2) / 3}, ${n2r.x} ${n2r.y}`,
    },
    // Tier 2 to tier 3 (straight track)
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
    // Tier 3 to mid milestone (graceful curves into diamond)
    {
      id: `${prefix}_conn_3l_4`,
      category,
      fromNodeId: `${prefix}_3l`,
      toNodeId: `${prefix}_4`,
      path: `M ${n3l.x} ${n3l.y} C ${(n3l.x * 2 + n4.x) / 3} ${(n3l.y * 2 + n4.y) / 3}, ${(n3l.x + n4.x * 2) / 3} ${(n3l.y + n4.y * 2) / 3}, ${n4.x} ${n4.y}`,
    },
    {
      id: `${prefix}_conn_3r_4`,
      category,
      fromNodeId: `${prefix}_3r`,
      toNodeId: `${prefix}_4`,
      path: `M ${n3r.x} ${n3r.y} C ${(n3r.x * 2 + n4.x) / 3} ${(n3r.y * 2 + n4.y) / 3}, ${(n3r.x + n4.x * 2) / 3} ${(n3r.y + n4.y * 2) / 3}, ${n4.x} ${n4.y}`,
    },

    // Mid milestone to tier 5 (clean orthogonal circuit bus)
    // Left conduit: n4 -> splitCenter -> splitLeft -> n5l
    {
      id: `${prefix}_conn_4_5l`,
      category,
      fromNodeId: `${prefix}_4`,
      toNodeId: `${prefix}_5l`,
      path: `M ${n4.x} ${n4.y} L ${splitCenter.x} ${splitCenter.y} L ${splitLeft.x} ${splitLeft.y} L ${n5l.x} ${n5l.y}`,
    },
    // Center conduit: n4 -> splitCenter -> n5c
    {
      id: `${prefix}_conn_4_5c`,
      category,
      fromNodeId: `${prefix}_4`,
      toNodeId: `${prefix}_5c`,
      path: `M ${n4.x} ${n4.y} L ${splitCenter.x} ${splitCenter.y} L ${n5c.x} ${n5c.y}`,
    },
    // Right conduit: n4 -> splitCenter -> splitRight -> n5r
    {
      id: `${prefix}_conn_4_5r`,
      category,
      fromNodeId: `${prefix}_4`,
      toNodeId: `${prefix}_5r`,
      path: `M ${n4.x} ${n4.y} L ${splitCenter.x} ${splitCenter.y} L ${splitRight.x} ${splitRight.y} L ${n5r.x} ${n5r.y}`,
    },

    // Tier 5 to tier 6 (3 parallel straight tracks)
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

    // Tier 6 capping crossbar (orthogonal bus capping the 3 tracks into a bridge)
    {
      id: `${prefix}_conn_6l_cap`,
      category,
      fromNodeId: `${prefix}_6l`,
      toNodeId: `${prefix}_7l`,
      path: `M ${n6l.x} ${n6l.y} L ${capLeft.x} ${capLeft.y} L ${capCenter.x} ${capCenter.y}`,
    },
    {
      id: `${prefix}_conn_6c_cap`,
      category,
      fromNodeId: `${prefix}_6c`,
      toNodeId: `${prefix}_7l`,
      path: `M ${n6c.x} ${n6c.y} L ${capCenter.x} ${capCenter.y}`,
    },
    {
      id: `${prefix}_conn_6r_cap`,
      category,
      fromNodeId: `${prefix}_6r`,
      toNodeId: `${prefix}_7l`,
      path: `M ${n6r.x} ${n6r.y} L ${capRight.x} ${capRight.y} L ${capCenter.x} ${capCenter.y}`,
    },

    // Apex stem and horizontal fork to milestone diamonds
    {
      id: `${prefix}_conn_stem`,
      category,
      fromNodeId: `${prefix}_6c`,
      toNodeId: `${prefix}_7l`,
      path: `M ${capCenter.x} ${capCenter.y} L ${stemApex.x} ${stemApex.y}`,
    },
    {
      id: `${prefix}_conn_apex_7l`,
      category,
      fromNodeId: `${prefix}_7l`,
      toNodeId: `${prefix}_7l`,
      path: `M ${stemApex.x} ${stemApex.y} L ${n7l.x} ${n7l.y}`,
    },
    {
      id: `${prefix}_conn_apex_7r`,
      category,
      fromNodeId: `${prefix}_7r`,
      toNodeId: `${prefix}_7r`,
      path: `M ${stemApex.x} ${stemApex.y} L ${n7r.x} ${n7r.y}`,
    },
  ];

  return connections;
}
