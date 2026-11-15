import type { SkillCategory } from '@/types';

export type BranchVisualConfig = {
  category: SkillCategory;
  name: string;
  nameIt: string;
  color: string;
  glowColor: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  angleDeg: number;
  origin: { x: number; y: number };
};

export const BRANCH_CONFIGS: Record<SkillCategory, BranchVisualConfig> = {
  CONDITIONING: {
    category: 'CONDITIONING',
    name: 'Conditioning',
    nameIt: 'CONDIZIONAMENTO',
    color: '#00e599',
    glowColor: 'rgba(0, 229, 153, 0.45)',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-500/20',
    angleDeg: -135,
    origin: { x: 520, y: 760 },
  },
  MOBILITY: {
    category: 'MOBILITY',
    name: 'Mobility',
    nameIt: 'MOBILITÀ',
    color: '#ffcc00',
    glowColor: 'rgba(255, 204, 0, 0.45)',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500',
    bgClass: 'bg-yellow-500/20',
    angleDeg: -90,
    origin: { x: 700, y: 690 },
  },
  SURVIVAL: {
    category: 'SURVIVAL',
    name: 'Survival',
    nameIt: 'SOPRAVVIVENZA',
    color: '#ff3344',
    glowColor: 'rgba(255, 51, 68, 0.45)',
    textClass: 'text-red-400',
    borderClass: 'border-red-500',
    bgClass: 'bg-red-500/20',
    angleDeg: -45,
    origin: { x: 880, y: 760 },
  },
};

export type CalculatedNodePos = {
  id: string;
  x: number;
  y: number;
  category: SkillCategory;
  tier: number;
  isMilestone: boolean;
};
