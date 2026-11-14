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
};
