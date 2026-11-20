export type RaidAction = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

export type RaidItem = {
  id: string;
  itemId: string;
  targetQuantity: number;
  foundQuantity: number;
  fromStash?: boolean;
  stashBaseTarget?: number;
};

export type RaidPlanState = {
  isRaidRunning: boolean;
  actions: RaidAction[];
  items: RaidItem[];
  preferredViewMode?: 'grid' | 'list';
  ignoredStashSnapshot?: Record<string, number>;
  updatedAt: number;
};
