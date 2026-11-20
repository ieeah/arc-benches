import type { StateCreator } from 'zustand';
import type { AppState, RaidPlanState } from '@/types';
import { bootProfileState } from '@/store/boot';
import { generateUUID } from '@/lib/uuid';

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
    const updatedInventory = { ...s.inventory };
    let addedItemsCount = 0;

    const remainingItems: typeof s.raidPlan.items = [];

    for (const item of s.raidPlan.items) {
      const isNeeded = (totalRequired[item.itemId] ?? 0) > 0;
      if (!isNeeded) {
        // Oggetto non richiesto dallo Stash: non viene versato né scalato
        remainingItems.push(item);
        continue;
      }

      if (item.foundQuantity > 0) {
        updatedInventory[item.itemId] = (updatedInventory[item.itemId] ?? 0) + item.foundQuantity;
        addedItemsCount += item.foundQuantity;
      }

      if (item.foundQuantity >= item.targetQuantity) {
        // Rimuovi item dal raid (raggiunto o superato)
        continue;
      } else if (item.foundQuantity > 0) {
        // Trovato parzialmente: scala targetQuantity, resetta foundQuantity a 0
        const nextTarget = Math.max(1, item.targetQuantity - item.foundQuantity);
        const nextBaseTarget = item.fromStash
          ? Math.max(0, (item.stashBaseTarget ?? item.targetQuantity) - item.foundQuantity)
          : 0;
        const stillLinkedToStash = Boolean(item.fromStash && nextBaseTarget > 0);

        remainingItems.push({
          ...item,
          targetQuantity: nextTarget,
          fromStash: stillLinkedToStash,
          stashBaseTarget: stillLinkedToStash ? nextBaseTarget : undefined,
          foundQuantity: 0,
        });
      } else {
        // Nessun progresso trovato: rimane invariato
        remainingItems.push(item);
      }
    }

    // Rimuove azioni completate, mantiene quelle incompiute
    const remainingActions = s.raidPlan.actions.filter(a => !a.completed);

    set({
      inventory: updatedInventory,
      raidPlan: {
        ...s.raidPlan,
        actions: remainingActions,
        items: remainingItems,
        updatedAt: Date.now(),
      },
    });

    return {
      addedItemsCount,
      remainingItemsCount: remainingItems.length,
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
    const syncedItems: typeof s.raidPlan.items = [];

    for (const item of s.raidPlan.items) {
      if (!item.fromStash) {
        // Aggiunto ex novo nel Raid: non viene toccato dallo Stash
        syncedItems.push(item);
        continue;
      }

      const neededNow = Math.max(0, (totalRequired[item.itemId] ?? 0) - (s.inventory[item.itemId] ?? 0));
      const baseTarget = item.stashBaseTarget ?? item.targetQuantity;
      const manualDelta = item.targetQuantity - baseTarget;
      const newTarget = Math.max(0, neededNow + manualDelta);

      if (newTarget > 0) {
        syncedItems.push({
          ...item,
          targetQuantity: newTarget,
          foundQuantity: Math.min(item.foundQuantity, newTarget),
          fromStash: neededNow > 0,
          stashBaseTarget: neededNow > 0 ? neededNow : undefined,
        });
      }
    }

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
