import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import { bootProfileState } from './boot';

export type InventorySlice = Pick<AppState,
  'inventory' | 'incrementItem' | 'decrementItem' | 'setItemCount'
>;

export const createInventorySlice: StateCreator<AppState, [], [], InventorySlice> = (set, get) => ({
  inventory: bootProfileState.inventory,

  incrementItem: (itemId) => {
    const s = get();
    set({ inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + 1 } });
  },

  decrementItem: (itemId) => {
    const s = get();
    set({ inventory: { ...s.inventory, [itemId]: Math.max(0, (s.inventory[itemId] ?? 0) - 1) } });
  },

  setItemCount: (itemId, val) => {
    const s = get();
    set({ inventory: { ...s.inventory, [itemId]: Math.max(0, val) } });
  },
});
