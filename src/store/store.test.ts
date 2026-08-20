import { describe, it, expect, beforeEach, vi } from 'vitest';
import { profileKey, PROFILES_KEY, SHARED_LISTS_KEY } from './persistence';

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

// Import store after global mock is registered
const { useAppStore } = await import('./index');

describe('useAppStore persistence boundary', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  it('automatically persists inventory modifications to localStorage', () => {
    useAppStore.getState().setItemCount('metal-parts', 42);

    const activeId = useAppStore.getState().activeProfileId;
    const raw = mockLocalStorage.getItem(profileKey(activeId));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.inventory['metal-parts']).toBe(42);
  });

  it('automatically persists module progress and level changes', () => {
    useAppStore.getState().setModuleCurrentLevel('workbench-scrapper', 2);

    const activeId = useAppStore.getState().activeProfileId;
    const raw = mockLocalStorage.getItem(profileKey(activeId));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.hideoutLevels['workbench-scrapper']).toBe(2);
  });

  it('automatically persists profile creation and profile switching', () => {
    useAppStore.getState().createProfile('Test Persona');
    const state = useAppStore.getState();
    const newProfileId = state.activeProfileId;

    const metaRaw = mockLocalStorage.getItem(PROFILES_KEY);
    expect(metaRaw).toBeTruthy();
    const meta = JSON.parse(metaRaw!);
    expect(meta.activeProfileId).toBe(newProfileId);
    expect(meta.profiles.some((p: { name: string }) => p.name === 'Test Persona')).toBe(true);

    const profileRaw = mockLocalStorage.getItem(profileKey(newProfileId));
    expect(profileRaw).toBeTruthy();
  });

  it('automatically persists shared custom lists across profiles', () => {
    useAppStore.getState().createCustomList({
      name: 'Global Objective',
      levels: [{ level: 1, requirementItemIds: [{ itemId: 'fabric', quantity: 5 }] }],
      shared: true,
    });

    const sharedRaw = mockLocalStorage.getItem(SHARED_LISTS_KEY);
    expect(sharedRaw).toBeTruthy();
    const shared = JSON.parse(sharedRaw!);
    expect(shared.some((l: { name: string }) => l.name === 'Global Objective')).toBe(true);
  });

  it('automatically persists personality changes', () => {
    useAppStore.getState().rollPersonality();
    const activePersonaId = useAppStore.getState().activePersonalityId;
    expect(activePersonaId).toBeTruthy();

    const activeId = useAppStore.getState().activeProfileId;
    const raw = mockLocalStorage.getItem(profileKey(activeId));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.activePersonalityId).toBe(activePersonaId);

    useAppStore.getState().clearPersonality();
    const rawCleared = mockLocalStorage.getItem(profileKey(activeId));
    expect(JSON.parse(rawCleared!).activePersonalityId).toBeNull();
  });

  it('automatically persists app settings modifications', () => {
    useAppStore.getState().setNavSide('left');
    useAppStore.getState().setRadialMenuEnabled(false);
    useAppStore.getState().setStartupProfileOption('main');

    expect(mockLocalStorage.getItem('nav-side')).toBe('left');
    expect(mockLocalStorage.getItem('radial-menu-enabled')).toBe('false');
    expect(mockLocalStorage.getItem('startup-profile-option')).toBe('main');

    const state = useAppStore.getState();
    expect(state.navSide).toBe('left');
    expect(state.radialMenuEnabled).toBe(false);
    expect(state.startupProfileOption).toBe('main');
  });
});