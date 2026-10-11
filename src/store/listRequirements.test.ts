import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CustomList } from '@/types';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

const mockLocalStorage = new MockStorage();
vi.stubGlobal('localStorage', mockLocalStorage);

const { useAppStore } = await import('./index');

const mk = (id: string, maxLevel: number, requiresOf?: (n: number) => { listId: string; level: number }[]): CustomList => ({
  id, name: id, listType: 'custom', custom: true, maxLevel,
  levels: Array.from({ length: maxLevel }, (_, i) => ({
    level: i + 1,
    requirementItemIds: [{ itemId: 'metal-parts', quantity: 2 }],
    actions: [{ id: `a${i + 1}`, label: `A${i + 1}` }],
    ...(requiresOf ? { requires: requiresOf(i + 1) } : {}),
  })),
});

// custom:out ← custom:res (Lvl N richiede out Lvl N)
const OUT = 'custom:out';
const RES = 'custom:res';
const out = mk(OUT, 3);
const res = mk(RES, 3, (n) => [{ listId: OUT, level: n }]);

const state = () => useAppStore.getState();

describe('requirements between lists in the store (#87)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    useAppStore.setState({
      customLists: [out, res],
      currentLevels: { [OUT]: 0, [RES]: 0 },
      targetLevels: { [OUT]: [1, 2, 3], [RES]: [1, 2, 3] },
      activeModules: { [OUT]: true, [RES]: true },
      checkedActions: {},
      inventory: { 'metal-parts': 100 },
    });
  });

  it('raising a list stops at the level whose requirement is not met', () => {
    state().setModuleCurrentLevel(OUT, 1);
    state().setModuleCurrentLevel(RES, 3); // richiede out Lvl 3, ma out è a 1
    expect(state().currentLevels[RES]).toBe(1);
    state().setModuleCurrentLevel(OUT, 3);
    state().setModuleCurrentLevel(RES, 3);
    expect(state().currentLevels[RES]).toBe(3);
  });

  it('a blocked raise changes nothing, materials included', () => {
    state().setModuleCurrentLevel(RES, 2, true);
    expect(state().currentLevels[RES]).toBe(0);
    expect(state().inventory['metal-parts']).toBe(100);
  });

  it('the upgrade is refused and not offered while the requirement is unmet', () => {
    useAppStore.setState({ inventory: { 'metal-parts': 100 }, checkedActions: { [`${RES}|1|a1`]: true } });
    expect(state().getAvailableUpgrades()).not.toContain(RES);
    state().upgradeModule(RES);
    expect(state().currentLevels[RES]).toBe(0);
    state().setModuleCurrentLevel(OUT, 1);
    expect(state().getAvailableUpgrades()).toContain(RES);
  });

  it('lowering the required list lowers the dependents and resets their progress, keeping the inventory', () => {
    state().setModuleCurrentLevel(OUT, 3, true);
    state().setModuleCurrentLevel(RES, 3, true);
    const inventory = state().inventory['metal-parts'];
    state().setModuleCurrentLevel(OUT, 1);
    expect(state().currentLevels[OUT]).toBe(1);
    expect(state().currentLevels[RES]).toBe(1);
    const left = Object.keys(state().checkedActions).filter((k) => k.startsWith(`${RES}|2|`) || k.startsWith(`${RES}|3|`));
    expect(left).toEqual([]);
    expect(state().checkedActions[`${RES}|1|a1`]).toBe(true);
    expect(state().inventory['metal-parts']).toBe(inventory);
  });

  it('the required list can rise and fall with the dependent at zero', () => {
    state().setModuleCurrentLevel(OUT, 3);
    state().setModuleCurrentLevel(OUT, 0);
    expect(state().currentLevels[OUT]).toBe(0);
    expect(state().currentLevels[RES]).toBe(0);
  });
});
