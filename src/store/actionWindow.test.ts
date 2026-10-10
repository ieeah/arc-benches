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
const { hydrateProfile } = await import('./gameData');

const LIST_ID = 'custom:window-test';

/** Quattro livelli: ognuno con un'azione; il 3 anche con un'azione a livelli di due passi e un oggetto da consegnare. */
const list: CustomList = {
  id: LIST_ID,
  name: 'Window',
  listType: 'custom',
  custom: true,
  maxLevel: 4,
  levels: [1, 2, 3, 4].map((level) => ({
    level,
    requirementItemIds: level === 3 ? [{ itemId: 'metal-parts', quantity: 5 }] : [],
    actions: [{ id: `a${level}`, label: `Action ${level}` }],
    ...(level === 3
      ? { tieredActions: [{ id: 't', label: 'Tiered', steps: [{ id: 's1', label: '1' }, { id: 's2', label: '2' }] }] }
      : {}),
  })),
};

const state = () => useAppStore.getState();
const key = (level: number, action: string) => `${LIST_ID}|${level}|${action}`;
const steps = [{ id: 's1', label: '1' }, { id: 's2', label: '2' }];

describe('action window (#111): the actions of level N count only with the current level at N-1', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    useAppStore.setState({
      customLists: [list],
      currentLevels: { [LIST_ID]: 1 },
      targetLevels: { [LIST_ID]: [2, 3, 4] },
      activeModules: { [LIST_ID]: true },
      checkedActions: {},
      inventory: { 'metal-parts': 20 },
    });
  });

  it('toggles only the actions of the level after the current one', () => {
    state().toggleAction(LIST_ID, 2, 'a2');
    expect(state().checkedActions[key(2, 'a2')]).toBe(true);
    state().toggleAction(LIST_ID, 3, 'a3'); // troppo presto
    state().toggleAction(LIST_ID, 1, 'a1'); // già superato
    expect(state().checkedActions[key(3, 'a3')]).toBeUndefined();
    expect(state().checkedActions[key(1, 'a1')]).toBeUndefined();
  });

  it('refuses batch and tiered-step changes out of the window too', () => {
    state().setLevelActionsBatch(LIST_ID, 3, ['a3'], true);
    state().setTieredActionStep(LIST_ID, 3, 't', steps, 0);
    expect(state().checkedActions).toEqual({});
    state().setLevelActionsBatch(LIST_ID, 2, ['a2'], true);
    expect(state().checkedActions[key(2, 'a2')]).toBe(true);
  });

  it('keys that do not belong to a list (expedition damage and catch-up) have no window', () => {
    state().toggleAction('expedition-damage', 0, 'tier_1');
    expect(state().checkedActions['expedition-damage|0|tier_1']).toBe(true);
  });

  it('raising the level completes actions and tiered steps of the levels passed and deducts the materials', () => {
    state().setModuleCurrentLevel(LIST_ID, 3, true);
    const checked = state().checkedActions;
    expect(checked[key(2, 'a2')]).toBe(true);
    expect(checked[key(3, 'a3')]).toBe(true);
    expect(checked[key(3, 't:s1')]).toBe(true);
    expect(checked[key(3, 't:s2')]).toBe(true);
    expect(checked[key(4, 'a4')]).toBeUndefined(); // il livello successivo è la nuova finestra
    expect(state().inventory['metal-parts']).toBe(15);
  });

  it('lowering the level resets actions, tiered steps and deliveries of the levels left, keeping inventory', () => {
    state().setModuleCurrentLevel(LIST_ID, 3, true);
    useAppStore.setState({ checkedActions: { ...state().checkedActions, [key(3, 'item_metal-parts')]: true } });
    state().setModuleCurrentLevel(LIST_ID, 1, false);
    const checked = state().checkedActions;
    expect(Object.keys(checked).filter((k) => k.startsWith(`${LIST_ID}|2|`) || k.startsWith(`${LIST_ID}|3|`))).toEqual([]);
    expect(state().inventory['metal-parts']).toBe(15);
  });

  it('after a level change the window moves: level 4 actions become valid at level 3', () => {
    state().setModuleCurrentLevel(LIST_ID, 3, false);
    state().toggleAction(LIST_ID, 4, 'a4');
    expect(state().checkedActions[key(4, 'a4')]).toBe(true);
  });
});

describe('profile loading', () => {
  it('drops saved ticks of actions beyond the window and keeps the rest', () => {
    const loaded = hydrateProfile({
      currentLevels: { [LIST_ID]: 1 },
      customLists: [list],
      checkedActions: {
        [key(1, 'a1')]: true, // livello superato: resta
        [key(2, 'a2')]: true, // finestra: resta
        [key(3, 'a3')]: true, // troppo presto: via
        [key(4, 'a4')]: true,
        'expedition-damage|0|tier_1': true, // non è una lista: resta
      },
    });
    expect(Object.keys(loaded.checkedActions).sort()).toEqual([key(1, 'a1'), key(2, 'a2'), 'expedition-damage|0|tier_1'].sort());
  });
});
