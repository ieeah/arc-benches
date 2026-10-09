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

  it('activates one pass at a time and refuses a second while one is active', () => {
    expect(state().setActiveRewardPass('frozen-trail')).toBe(true);
    expect(state().activeRewardPass).toBe('frozen-trail');
    expect(state().currentLevels['frozen-trail']).toBe(0);
    expect(state().setActiveRewardPass('legacy')).toBe(false);
    expect(state().activeRewardPass).toBe('frozen-trail');
  });

  it('refuses unknown and already completed passes', () => {
    expect(state().setActiveRewardPass('nope')).toBe(false);
    state().setActiveRewardPass('legacy');
    state().concludeRewardPass();
    expect(state().setActiveRewardPass('legacy')).toBe(false);
  });

  it('clamps the reached tier to 0..maxLevel and only works on the active pass', () => {
    state().setRewardPassLevel(3);
    expect(state().currentLevels['legacy']).toBeUndefined();
    state().setActiveRewardPass('legacy');
    state().setRewardPassLevel(7);
    expect(state().currentLevels['legacy']).toBe(7);
    state().setRewardPassLevel(99);
    expect(state().currentLevels['legacy']).toBe(10);
    state().setRewardPassLevel(-4);
    expect(state().currentLevels['legacy']).toBe(0);
  });

  it('concluding sets the last tier, records the history entry and frees the selection', () => {
    state().setActiveRewardPass('legacy');
    state().setRewardPassLevel(2);
    state().concludeRewardPass();
    expect(state().activeRewardPass).toBeNull();
    expect(state().currentLevels['legacy']).toBe(10);
    expect(state().completedRewardPasses).toHaveLength(1);
    expect(state().completedRewardPasses[0]).toMatchObject({ id: 'legacy', name: 'Pass legacy' });
    expect(state().setActiveRewardPass('frozen-trail')).toBe(true);
  });

  it('the escape hatch drops the active pass and its progress, keeping the history', () => {
    state().setActiveRewardPass('legacy');
    state().concludeRewardPass();
    state().setActiveRewardPass('frozen-trail');
    state().setRewardPassLevel(12);
    state().resetActiveRewardPass();
    expect(state().activeRewardPass).toBeNull();
    expect('frozen-trail' in state().currentLevels).toBe(false);
    expect(state().completedRewardPasses.map(c => c.id)).toEqual(['legacy']);
  });

  it('an orphan active pass (no longer in the seed) can be marked completed or abandoned', () => {
    useAppStore.setState({ activeRewardPass: 'old-season', currentLevels: { 'old-season': 30 } });
    state().resolveOrphanRewardPass('completed');
    expect(state().activeRewardPass).toBeNull();
    expect(state().completedRewardPasses[0]).toMatchObject({ id: 'old-season', name: 'old-season' });
    expect(state().currentLevels['old-season']).toBe(30);

    useAppStore.setState({ activeRewardPass: 'other-old', currentLevels: { 'other-old': 8 } });
    state().resolveOrphanRewardPass('abandoned');
    expect(state().activeRewardPass).toBeNull();
    expect('other-old' in state().currentLevels).toBe(false);
    expect(state().completedRewardPasses.map(c => c.id)).toEqual(['old-season']);
  });

  it('resolving does nothing when the active pass still exists', () => {
    state().setActiveRewardPass('legacy');
    state().resolveOrphanRewardPass('abandoned');
    expect(state().activeRewardPass).toBe('legacy');
  });

  it('persists the active pass and the history per profile', () => {
    state().setActiveRewardPass('legacy');
    const raw = JSON.parse(mockLocalStorage.getItem(profileKey(state().activeProfileId))!);
    expect(raw.activeRewardPass).toBe('legacy');
    state().concludeRewardPass();
    const after = JSON.parse(mockLocalStorage.getItem(profileKey(state().activeProfileId))!);
    expect(after.activeRewardPass).toBeNull();
    expect(after.completedRewardPasses[0].id).toBe('legacy');
  });
});
