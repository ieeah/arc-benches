import type { StateCreator } from 'zustand';
import type { AppState, RaidPlanState } from '@/types';
import { bootProfileState } from '@/store/boot';
import { generateUUID } from '@/lib/uuid';
import { applyRaidPlanToStashPure, syncRaidWithStashPure } from '@/engine/raidPlan';

export type RaidPlanSlice = Pick<
  AppState,
  | 'raidPlan'
  | 'setIsRaidRunning'
  | 'addRaidAction'
  | 'toggleRaidAction'
  | 'removeRaidAction'
  | 'addRaidItem'
  | 'updateRaidItemFound'
  | 'setRaidItemFoundQuantity'
  | 'setRaidItemFoundAll'
  | 'updateRaidItemTarget'
  | 'replaceRaidItem'
  | 'removeRaidItem'
  | 'applyRaidPlanToStash'
  | 'resetRaidPlanProgress'
  | 'clearRaidPlan'
  | 'setRaidPreferredViewMode'
  | 'ignoreStashDiff'
  | 'syncRaidWithStash'
>;

const DEFAULT_RAID_PLAN: RaidPlanState = {
  isRaidRunning: false,
  actions: [],
  items: [],
  updatedAt: Date.now(),
};

export const createRaidPlanSlice: StateCreator<AppState, [], [], RaidPlanSlice> = (set, get) => ({
  raidPlan: bootProfileState.raidPlan ?? DEFAULT_RAID_PLAN,

  setIsRaidRunning: (isRunning: boolean) => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        isRaidRunning: isRunning,
        updatedAt: Date.now(),
      },
    });
  },

  addRaidAction: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const s = get();
    const newAction = {
      id: generateUUID(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    set({
      raidPlan: {
        ...s.raidPlan,
        actions: [...s.raidPlan.actions, newAction],
        updatedAt: Date.now(),
      },
    });
  },

  toggleRaidAction: (id: string) => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        actions: s.raidPlan.actions.map(a =>
          a.id === id ? { ...a, completed: !a.completed } : a
        ),
        updatedAt: Date.now(),
      },
    });
  },

  removeRaidAction: (id: string) => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        actions: s.raidPlan.actions.filter(a => a.id !== id),
        updatedAt: Date.now(),
      },
    });
  },

  addRaidItem: (itemId: string, targetQuantity: number = 1, options?: { fromStash?: boolean }) => {
    const s = get();
    const qty = Math.max(1, targetQuantity);
    const fromStash = options?.fromStash === true;
    const existingIndex = s.raidPlan.items.findIndex(i => i.itemId === itemId);
    const updatedItems = [...s.raidPlan.items];

    if (existingIndex >= 0) {
      const existing = updatedItems[existingIndex];
      if (fromStash) {
        const manualDelta = existing.fromStash
          ? existing.targetQuantity - (existing.stashBaseTarget ?? existing.targetQuantity)
          : existing.targetQuantity;
        updatedItems[existingIndex] = {
          ...existing,
          targetQuantity: Math.max(1, qty + manualDelta),
          fromStash: true,
          stashBaseTarget: qty,
        };
      } else {
        updatedItems[existingIndex] = {
          ...existing,
          targetQuantity: existing.targetQuantity + qty,
        };
      }
    } else {
      updatedItems.push({
        id: generateUUID(),
        itemId,
        targetQuantity: qty,
        foundQuantity: 0,
        ...(fromStash ? { fromStash: true, stashBaseTarget: qty } : {}),
      });
    }

    set({
      raidPlan: {
        ...s.raidPlan,
        items: updatedItems,
        updatedAt: Date.now(),
      },
    });
  },

  updateRaidItemFound: (id: string, delta: number) => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        items: s.raidPlan.items.map(item => {
          if (item.id !== id) return item;
          const nextFound = Math.max(0, item.foundQuantity + delta);
          return {
            ...item,
            foundQuantity: nextFound,
          };
        }),
        updatedAt: Date.now(),
      },
    });
  },

  setRaidItemFoundQuantity: (id: string, quantity: number) => {
    const s = get();
    const qty = Math.max(0, quantity);
    set({
      raidPlan: {
        ...s.raidPlan,
        items: s.raidPlan.items.map(item =>
          item.id === id ? { ...item, foundQuantity: qty } : item
        ),
        updatedAt: Date.now(),
      },
    });
  },

  setRaidItemFoundAll: (id: string) => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        items: s.raidPlan.items.map(item =>
          item.id === id ? { ...item, foundQuantity: item.targetQuantity } : item
        ),
        updatedAt: Date.now(),
      },
    });
  },

  updateRaidItemTarget: (id: string, targetQuantity: number) => {
    const s = get();
    const qty = Math.max(1, targetQuantity);
    set({
      raidPlan: {
        ...s.raidPlan,
        items: s.raidPlan.items.map(item =>
          item.id === id ? { ...item, targetQuantity: qty } : item
        ),
        updatedAt: Date.now(),
      },
    });
  },

  replaceRaidItem: (id: string, newItemId: string) => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        items: s.raidPlan.items.map(item =>
          item.id === id ? { ...item, itemId: newItemId } : item
        ),
        updatedAt: Date.now(),
      },
    });
  },

  removeRaidItem: (id: string) => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        items: s.raidPlan.items.filter(item => item.id !== id),
        updatedAt: Date.now(),
      },
    });
  },

  applyRaidPlanToStash: () => {
    const s = get();
    const totalRequired = s.getTotalRequiredMaterials();
    const result = applyRaidPlanToStashPure(s.raidPlan, s.inventory, totalRequired);

    set({
      inventory: result.inventory,
      raidPlan: {
        ...s.raidPlan,
        actions: result.actions,
        items: result.items,
        updatedAt: Date.now(),
      },
    });

    return {
      addedItemsCount: result.addedItemsCount,
      remainingItemsCount: result.remainingItemsCount,
    };
  },

  resetRaidPlanProgress: () => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        actions: s.raidPlan.actions.map(a => ({ ...a, completed: false })),
        items: s.raidPlan.items.map(i => ({ ...i, foundQuantity: 0 })),
        updatedAt: Date.now(),
      },
    });
  },

  clearRaidPlan: () => {
    set({
      raidPlan: {
        isRaidRunning: false,
        actions: [],
        items: [],
        updatedAt: Date.now(),
      },
    });
  },

  setRaidPreferredViewMode: (preferredViewMode: 'grid' | 'list') => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        preferredViewMode,
        updatedAt: Date.now(),
      },
    });
  },

  ignoreStashDiff: (snapshot: Record<string, number>) => {
    const s = get();
    set({
      raidPlan: {
        ...s.raidPlan,
        ignoredStashSnapshot: snapshot,
        updatedAt: Date.now(),
      },
    });
  },

  syncRaidWithStash: () => {
    const s = get();
    const totalRequired = s.getTotalRequiredMaterials();
    const syncedItems = syncRaidWithStashPure(s.raidPlan.items, s.inventory, totalRequired);

    set({
      raidPlan: {
        ...s.raidPlan,
        items: syncedItems,
        ignoredStashSnapshot: undefined,
        updatedAt: Date.now(),
      },
    });
  },
});
