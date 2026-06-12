import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, HideoutModule } from './types';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      modules: [],
      itemsInfo: {},
      hideoutLevels: {},
      targetLevels: {},
      activeModules: {},
      inventory: {},
      filterHideCompleted: true,

      setModules: (modules: HideoutModule[]) => {
        const filteredModules = modules.filter(m => m.id !== 'workbench');
        const hideoutLevels = { ...get().hideoutLevels };
        const targetLevels = { ...get().targetLevels };
        const activeModules = { ...get().activeModules };

        filteredModules.forEach((mod) => {
          if (hideoutLevels[mod.id] === undefined) hideoutLevels[mod.id] = 0;
          if (targetLevels[mod.id] === undefined) targetLevels[mod.id] = mod.maxLevel;
          if (activeModules[mod.id] === undefined) activeModules[mod.id] = true;
        });

        set({ modules: filteredModules, hideoutLevels, targetLevels, activeModules });
      },

      setItemsInfo: (items) => {
        const itemsInfo: Record<string, ItemInfo> = {};
        items.forEach(item => {
          itemsInfo[item.id] = item;
        });
        set({ itemsInfo });
      },

      incrementItem: (itemId) =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: (state.inventory[itemId] || 0) + 1,
          },
        })),

      decrementItem: (itemId) =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: Math.max(0, (state.inventory[itemId] || 0) - 1),
          },
        })),

      setItemCount: (itemId, val) =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: Math.max(0, val),
          },
        })),

      setModuleCurrentLevel: (moduleId, level) =>
        set((state) => ({
          hideoutLevels: {
            ...state.hideoutLevels,
            [moduleId]: level,
          },
        })),

      setModuleTargetLevel: (moduleId, level) =>
        set((state) => ({
          targetLevels: {
            ...state.targetLevels,
            [moduleId]: level,
          },
        })),

      toggleModuleActive: (moduleId) =>
        set((state) => ({
          activeModules: {
            ...state.activeModules,
            [moduleId]: !state.activeModules[moduleId],
          },
        })),

      setFilterHideCompleted: (val) => set({ filterHideCompleted: val }),

      upgradeModule: (moduleId) => {
        const state = get();
        const mod = state.modules.find((m) => m.id === moduleId);
        if (!mod) return;

        const currentLevel = state.hideoutLevels[moduleId] || 0;
        if (currentLevel >= mod.maxLevel) return;

        const nextLevelData = mod.levels.find((l) => l.level === currentLevel + 1);
        if (!nextLevelData) return;

        // Subtract materials
        const newInventory = { ...state.inventory };
        nextLevelData.requirementItemIds.forEach((req) => {
          newInventory[req.itemId] = Math.max(0, (newInventory[req.itemId] || 0) - req.quantity);
        });

        set({
          inventory: newInventory,
          hideoutLevels: {
            ...state.hideoutLevels,
            [moduleId]: currentLevel + 1,
          },
        });
      },

      // SELECTORS
      getTotalRequiredMaterials: () => {
        const state = get();
        const total: Record<string, number> = {};

        state.modules.forEach((mod) => {
          if (!state.activeModules[mod.id]) return;

          const currentLevel = state.hideoutLevels[mod.id] || 0;
          const targetLevel = state.targetLevels[mod.id] || 0;

          mod.levels.forEach((lvl) => {
            if (lvl.level > currentLevel && lvl.level <= targetLevel) {
              lvl.requirementItemIds.forEach((req) => {
                total[req.itemId] = (total[req.itemId] || 0) + req.quantity;
              });
            }
          });
        });

        return total;
      },

      getMissingMaterials: () => {
        const state = get();
        const required = state.getTotalRequiredMaterials();
        const inventory = state.inventory;

        return Object.entries(required).map(([itemId, reqQty]) => {
          const owned = inventory[itemId] || 0;
          return {
            itemId,
            owned,
            required: reqQty,
            missing: Math.max(0, reqQty - owned),
            isCompleted: owned >= reqQty,
          };
        });
      },

      getAvailableUpgrades: () => {
        const state = get();
        const available: string[] = [];

        state.modules.forEach((mod) => {
          if (!state.activeModules[mod.id]) return;

          const currentLevel = state.hideoutLevels[mod.id] || 0;
          if (currentLevel >= mod.maxLevel) return;

          const nextLevelData = mod.levels.find((l) => l.level === currentLevel + 1);
          if (!nextLevelData) return;

          const canAfford = nextLevelData.requirementItemIds.every((req) => {
            return (state.inventory[req.itemId] || 0) >= req.quantity;
          });

          if (canAfford) {
            available.push(mod.id);
          }
        });

        return available;
      },
    }),
    {
      name: 'arc-raiders-tracker-storage',
      partialize: (state) => ({
        hideoutLevels: state.hideoutLevels,
        targetLevels: state.targetLevels,
        activeModules: state.activeModules,
        inventory: state.inventory,
        filterHideCompleted: state.filterHideCompleted,
      }),
    }
  )
);
