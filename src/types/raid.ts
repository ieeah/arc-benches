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
};

export type RaidPlanState = {
  isRaidRunning: boolean;
  actions: RaidAction[];
  items: RaidItem[];
  preferredViewMode?: 'grid' | 'list';
  updatedAt: number;
};
