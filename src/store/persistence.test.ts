import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PROFILES_KEY,
  SHARED_LISTS_KEY,
  profileKey,
  saveProfilesMeta,
  loadProfilesMeta,
  initProfilesMeta,
  saveProfileState,
  loadProfileState,
  saveSharedLists,
  loadSharedLists,
  removeProfileKey,
} from '@/store/persistence';
import type { PersistedState } from '@/store/persistence';
import type { List } from '@/types';

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

describe('persistence.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Profiles Meta', () => {
    it('saves and loads profiles metadata', () => {
      const meta = {
        profiles: [{ id: 'default', name: 'Principale' }, { id: 'p2', name: 'Secondario' }],
        activeProfileId: 'p2',
      };
      saveProfilesMeta(meta);

      const raw = localStorage.getItem(PROFILES_KEY);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toEqual(meta);

      const loaded = loadProfilesMeta();
      expect(loaded).toEqual(meta);
    });

    it('returns null for corrupt profiles metadata', () => {
      localStorage.setItem(PROFILES_KEY, 'invalid-json');
      expect(loadProfilesMeta()).toBeNull();

      localStorage.setItem(PROFILES_KEY, JSON.stringify({ profiles: 'not-an-array' }));
      expect(loadProfilesMeta()).toBeNull();

      localStorage.setItem(PROFILES_KEY, JSON.stringify({ profiles: [] }));
      expect(loadProfilesMeta()).toBeNull();
    });

    it('falls back activeProfileId if stale', () => {
      localStorage.setItem(PROFILES_KEY, JSON.stringify({
        profiles: [{ id: 'p1', name: 'One' }],
        activeProfileId: 'stale-id',
      }));
      const loaded = loadProfilesMeta();
      expect(loaded?.activeProfileId).toBe('p1');
    });

    it('initProfilesMeta seeds default profile on empty storage', () => {
      const meta = initProfilesMeta();
      expect(meta).toEqual({
        profiles: [{ id: 'default', name: 'Principale' }],
        activeProfileId: 'default',
      });
      expect(loadProfilesMeta()).toEqual(meta);
    });
  });

  describe('Profile State', () => {
    const sampleState: PersistedState = {
      hideoutLevels: { workbench1: 2 },
      targetLevels: { workbench1: [3] },
      activeModules: { workbench1: true },
      inventory: { 'metal-parts': 10 },
      filterHideCompleted: false,
      listOrder: ['workbench1'],
      customLists: [],
      checkedActions: { 'workbench1|1|act1': true },
      activePersonalityId: 'persona-1',
      ownedBlueprints: { 'bp-1': true },
      filterHideOwnedBlueprints: false,
    };

    it('saves and loads active profile state', () => {
      saveProfileState('p1', sampleState);

      const raw = localStorage.getItem(profileKey('p1'));
      expect(raw).toBeTruthy();

      const loaded = loadProfileState('p1');
      expect(loaded.inventory).toEqual({ 'metal-parts': 10 });
      expect(loaded.hideoutLevels).toEqual({ workbench1: 2 });
      expect(loaded.activePersonalityId).toBe('persona-1');
      expect(loaded.checkedActions).toEqual({ 'workbench1|1|act1': true });
    });

    it('loads legacy single-profile key if default profile is missing', () => {
      localStorage.setItem('arc-raiders-tracker-storage', JSON.stringify({
        inventory: { 'rubber-parts': 5 },
      }));
      const loaded = loadProfileState('default');
      expect(loaded.inventory).toEqual({ 'rubber-parts': 5 });
    });

    it('removes profile key correctly', () => {
      saveProfileState('p-to-remove', sampleState);
      expect(localStorage.getItem(profileKey('p-to-remove'))).toBeTruthy();

      removeProfileKey('p-to-remove');
      expect(localStorage.getItem(profileKey('p-to-remove'))).toBeNull();
    });

    it('handles localStorage throwing errors gracefully via safeLS', () => {
      const spy = vi.spyOn(mockLocalStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      expect(() => saveProfileState('p1', sampleState)).not.toThrow();
      expect(() => saveProfilesMeta({ profiles: [{ id: '1', name: 'A' }], activeProfileId: '1' })).not.toThrow();
      expect(() => saveSharedLists([])).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('Shared Lists', () => {
    it('saves and loads shared lists', () => {
      const sampleList: List = {
        id: 'custom:123',
        name: 'Shared Goal',
        maxLevel: 1,
        levels: [{ level: 1, requirementItemIds: [{ itemId: 'metal-parts', quantity: 2 }] }],
        custom: true,
        shared: true,
      };

      saveSharedLists([sampleList]);
      const loaded = loadSharedLists();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('custom:123');
      expect(loaded[0].name).toBe('Shared Goal');
    });

    it('returns empty array when shared lists key is corrupt', () => {
      localStorage.setItem(SHARED_LISTS_KEY, 'corrupted');
      expect(loadSharedLists()).toEqual([]);
    });
  });
});