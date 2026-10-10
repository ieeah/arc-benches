import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PassList } from '@/types';
import { profileKey } from '@/store/persistence';

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

const pass = (id: string, maxLevel = 5): PassList => ({
  id,
  name: `Pass ${id}`,
  listType: 'pass',
  maxLevel,
  tracks: [{ id: 'free', name: 'Free' }],
  levels: Array.from({ length: maxLevel }, (_, i) => ({ level: i + 1, requirementItemIds: [] })),
});

const state = () => useAppStore.getState();

describe('reward pass slice', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    useAppStore.setState({
      passes: [pass('frozen-trail', 60), pass('legacy', 10)],
      activeRewardPass: null,
      completedRewardPasses: [],
      currentLevels: {},
    });
  });

  it('switches the active pass at any time and keeps the level of the previous one', () => {
    expect(state().setActiveRewardPass('frozen-trail')).toBe(true);
    state().setRewardPassLevel(12);
    expect(state().setActiveRewardPass('legacy')).toBe(true);
    expect(state().activeRewardPass).toBe('legacy');
    expect(state().currentLevels['frozen-trail']).toBe(12);
    expect(state().currentLevels['legacy']).toBe(0);
    state().setRewardPassLevel(4);
    // tornando al primo si riparte dal suo livello
    expect(state().setActiveRewardPass('frozen-trail')).toBe(true);
    expect(state().currentLevels['frozen-trail']).toBe(12);
    expect(state().currentLevels['legacy']).toBe(4);
  });

  it('None is a valid choice and keeps every level', () => {
    state().setActiveRewardPass('legacy');
    state().setRewardPassLevel(3);
    expect(state().setActiveRewardPass(null)).toBe(true);
    expect(state().activeRewardPass).toBeNull();
    expect(state().currentLevels['legacy']).toBe(3);
  });

  it('refuses unknown passes and passes no longer in the game', () => {
    expect(state().setActiveRewardPass('nope')).toBe(false);
    useAppStore.setState({ passes: [pass('frozen-trail', 60), { ...pass('legacy', 10), active: false }] });
    expect(state().setActiveRewardPass('legacy')).toBe(false);
    expect(state().activeRewardPass).toBeNull();
  });

  it('the starting level is clamped to 0..maxLevel-1', () => {
    state().setActiveRewardPass('legacy', 7);
    expect(state().currentLevels['legacy']).toBe(7);
    state().setActiveRewardPass('legacy', 99);
    expect(state().currentLevels['legacy']).toBe(9);
    state().setActiveRewardPass('legacy', -3);
    expect(state().currentLevels['legacy']).toBe(0);
  });

  it('clamps the level to 0..maxLevel and can target a pass that is not active', () => {
    state().setRewardPassLevel(3);
    expect(state().currentLevels['legacy']).toBeUndefined(); // nessun pass attivo
    state().setActiveRewardPass('legacy');
    state().setRewardPassLevel(7);
    expect(state().currentLevels['legacy']).toBe(7);
    state().setRewardPassLevel(-4);
    expect(state().currentLevels['legacy']).toBe(0);
    state().setRewardPassLevel(20, 'frozen-trail');
    expect(state().currentLevels['frozen-trail']).toBe(20);
    expect(state().activeRewardPass).toBe('legacy');
  });

  it('reaching the last level completes the pass, records the archive entry and, with one candidate, activates it', () => {
    state().setActiveRewardPass('legacy');
    state().setRewardPassLevel(2);
    const result = state().setRewardPassLevel(10);
    expect(result).toEqual({ completed: true, choices: [] });
    expect(state().currentLevels['legacy']).toBe(10);
    expect(state().completedRewardPasses).toHaveLength(1);
    expect(state().completedRewardPasses[0]).toMatchObject({ id: 'legacy' });
    expect(state().activeRewardPass).toBe('frozen-trail'); // l'unico altro pass da fare
  });

  it('with several candidates it asks, with none it leaves no active pass', () => {
    useAppStore.setState({ passes: [pass('a', 5), pass('b', 5), pass('c', 5)] });
    state().setActiveRewardPass('a');
    expect(state().concludeRewardPass()).toEqual({ completed: true, choices: ['b', 'c'] });
    expect(state().activeRewardPass).toBeNull();

    useAppStore.setState({ passes: [pass('a', 5)], activeRewardPass: null, completedRewardPasses: [], currentLevels: {} });
    state().setActiveRewardPass('a');
    expect(state().concludeRewardPass()).toEqual({ completed: true, choices: [] });
    expect(state().activeRewardPass).toBeNull();
  });

  it('completing a pass that is not active does not change the active one', () => {
    state().setActiveRewardPass('frozen-trail');
    state().setRewardPassLevel(10, 'legacy');
    expect(state().activeRewardPass).toBe('frozen-trail');
    expect(state().completedRewardPasses.map(c => c.id)).toEqual(['legacy']);
  });

  it('lowering a completed pass below the maximum removes it from the archive', () => {
    state().setActiveRewardPass('legacy');
    state().concludeRewardPass();
    state().setRewardPassLevel(9, 'legacy');
    expect(state().completedRewardPasses).toEqual([]);
  });

  it('reactivating a completed pass restarts it at maxLevel - 1 and removes it from the archive', () => {
    state().setActiveRewardPass('legacy');
    state().concludeRewardPass();
    expect(state().setActiveRewardPass('legacy')).toBe(true);
    expect(state().activeRewardPass).toBe('legacy');
    expect(state().currentLevels['legacy']).toBe(9);
    expect(state().completedRewardPasses).toEqual([]);
  });

  it('resetting the progress drops the level and the archive entry but keeps the pass active', () => {
    state().setActiveRewardPass('legacy');
    state().setRewardPassLevel(6);
    state().resetRewardPassProgress('legacy');
    expect('legacy' in state().currentLevels).toBe(false);
    expect(state().activeRewardPass).toBe('legacy');
    state().concludeRewardPass();
    state().resetRewardPassProgress('legacy');
    expect(state().completedRewardPasses).toEqual([]);
  });

  it('an active pass that left the game becomes none once acknowledged, keeping its level', () => {
    useAppStore.setState({ activeRewardPass: 'legacy', currentLevels: { legacy: 6 }, passes: [pass('frozen-trail', 60), { ...pass('legacy', 10), active: false }] });
    state().acknowledgeInactiveRewardPass();
    expect(state().activeRewardPass).toBeNull();
    expect(state().currentLevels['legacy']).toBe(6);
  });

  it('acknowledging does nothing while the active pass is valid', () => {
    state().setActiveRewardPass('legacy', 3);
    state().acknowledgeInactiveRewardPass();
    expect(state().activeRewardPass).toBe('legacy');
  });

  it('persists the active pass and the history per profile', () => {
    state().setActiveRewardPass('legacy');
    const raw = JSON.parse(mockLocalStorage.getItem(profileKey(state().activeProfileId))!);
    expect(raw.activeRewardPass).toBe('legacy');
    state().concludeRewardPass();
    const after = JSON.parse(mockLocalStorage.getItem(profileKey(state().activeProfileId))!);
    expect(after.activeRewardPass).toBe('frozen-trail'); // l'unico altro pass da fare si attiva da solo
    expect(after.completedRewardPasses[0].id).toBe('legacy');
  });
});
