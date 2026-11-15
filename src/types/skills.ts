export type SkillCategory = 'CONDITIONING' | 'MOBILITY' | 'SURVIVAL';

export type SkillLocalizedText = {
  en: string;
  it: string;
};

export type SkillNode = {
  id: string;
  name: SkillLocalizedText;
  category: SkillCategory;
  isMajor: boolean;
  description: SkillLocalizedText;
  maxPoints: number;
  impactedSkill?: SkillLocalizedText;
  knownValue?: string[];
  position: {
    x: number;
    y: number;
  };
  prerequisiteNodeIds: string[];
  iconName: string;
  icon: string;
  minPointsSpent?: number;
};

export type SkillTreeState = {
  skillAllocations: Record<string, number>;
  extraSkillPoints: number;
  sandboxMode: boolean;

  // Optional legacy fields for backward compatibility
  raiderLevel?: number;
  useExpeditionBonus?: boolean;

  allocateSkillPoint: (nodeId: string) => boolean;
  decrementSkillPoint: (nodeId: string) => boolean;
  setSkillPoints: (nodeId: string, points: number) => boolean;
  autoAllocatePath: (targetNodeId: string) => boolean;
  resetSkillTree: (branch?: SkillCategory) => void;
  setExtraSkillPoints: (points: number) => void;
  setSandboxMode: (sandbox: boolean) => void;

  setRaiderLevel?: (level: number) => void;
  setUseExpeditionBonus?: (use: boolean) => void;
};
