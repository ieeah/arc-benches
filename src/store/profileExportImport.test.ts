import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MultiProfileExportFile } from '@/types';

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

describe('Test Plan 2.x — Manual/Integration Collaudo Export/Import Profilo (#74)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  it('Test 2.1 & 2.2 — Genera payload di export con tutti i 10 campi densi popolati', () => {
    const store = useAppStore.getState();

    // 2.1: Configurazione profilo con dati densi
    useAppStore.setState({
      checkedActions: { 'workbench:1:act1': true, 'expedition:damage|phase1': true },
      listOrder: ['refiner', 'workbench', 'custom:sample'],
      completedExpeditionsCount: 7,
      earnedPermanentSkillPoints: 14,
      consecutiveStreak: 4,
      departureWindowActive: true,
      ownedBlueprints: { 'bp-anvil': true, 'bp-bobcat': true },
      filterHideCompleted: false,
      filterHideOwnedBlueprints: true,
      activePersonalityId: 'tactician',
    });

    const activeProfileId = useAppStore.getState().activeProfileId;

    // 2.2: Esecuzione buildExportData
    const exportResult = useAppStore.getState().buildExportData([activeProfileId]);
    const filePayload: MultiProfileExportFile = {
      version: 3,
      exportedAt: new Date().toISOString(),
      sharedLists: exportResult.sharedLists,
      profiles: exportResult.profiles,
    };

    // Validazione ispezione JSON
    expect(filePayload.version).toBe(3);
    expect(filePayload.profiles).toHaveLength(1);

    const exportedProfile = filePayload.profiles[0];
    expect(exportedProfile.checkedActions).toEqual({
      'workbench:1:act1': true,
      'expedition:damage|phase1': true,
    });
    expect(exportedProfile.listOrder).toEqual(['refiner', 'workbench', 'custom:sample']);
    expect(exportedProfile.completedExpeditionsCount).toBe(7);
    expect(exportedProfile.earnedPermanentSkillPoints).toBe(14);
    expect(exportedProfile.consecutiveStreak).toBe(4);
    expect(exportedProfile.departureWindowActive).toBe(true);
    expect(exportedProfile.ownedBlueprints).toEqual({ 'bp-anvil': true, 'bp-bobcat': true });
    expect(exportedProfile.filterHideCompleted).toBe(false);
    expect(exportedProfile.filterHideOwnedBlueprints).toBe(true);
    expect(exportedProfile.activePersonalityId).toBe('tactician');
  });

  it('Test 2.3 — Ripristino completo e fedele su un nuovo profilo', () => {
    // Creazione del file di backup con profilo denso
    const backupData: MultiProfileExportFile = {
      version: 3,
      exportedAt: new Date().toISOString(),
      sharedLists: [],
      profiles: [
        {
          profile: { id: 'restored-profile', name: 'Collaudo Restore' },
          lists: [],
          inventory: { 'metal-parts': 100 },
          checkedActions: { 'refiner:1:filter': true, 'expedition:damage|1': true },
          listOrder: ['workbench', 'refiner'],
          completedExpeditionsCount: 12,
          earnedPermanentSkillPoints: 10,
          consecutiveStreak: 5,
          departureWindowActive: true,
          ownedBlueprints: { 'bp-torrente': true },
          filterHideCompleted: false,
          filterHideOwnedBlueprints: true,
          activePersonalityId: 'scrapper-leader',
        },
      ],
    };

    // Esecuzione importMultiProfile
    useAppStore.getState().importMultiProfile(backupData, ['restored-profile']);

    // Passaggio al profilo ripristinato
    useAppStore.getState().switchProfile('restored-profile');

    const restoredState = useAppStore.getState();
    expect(restoredState.activeProfileId).toBe('restored-profile');
    expect(restoredState.inventory['metal-parts']).toBe(100);
    expect(restoredState.checkedActions).toEqual({ 'refiner:1:filter': true, 'expedition:damage|1': true });
    expect(restoredState.listOrder).toEqual(['workbench', 'refiner']);
    expect(restoredState.completedExpeditionsCount).toBe(12);
    expect(restoredState.earnedPermanentSkillPoints).toBe(10);
    expect(restoredState.consecutiveStreak).toBe(5);
    expect(restoredState.departureWindowActive).toBe(true);
    expect(restoredState.ownedBlueprints).toEqual({ 'bp-torrente': true });
    expect(restoredState.filterHideCompleted).toBe(false);
    expect(restoredState.filterHideOwnedBlueprints).toBe(true);
    expect(restoredState.activePersonalityId).toBe('scrapper-leader');
  });

  it('Test 2.4 — Retrocompatibilità con backup v3 privi dei 10 campi estesi', () => {
    const legacyBackup: MultiProfileExportFile = {
      version: 3,
      exportedAt: new Date().toISOString(),
      sharedLists: [],
      profiles: [
        {
          profile: { id: 'legacy-profile', name: 'Legacy v3 Profile' },
          lists: [],
          inventory: { 'plastic-parts': 25 },
          // Nessuno dei 10 campi estesi presente
        },
      ],
    };

    expect(() => {
      useAppStore.getState().importMultiProfile(legacyBackup, ['legacy-profile']);
    }).not.toThrow();

    useAppStore.getState().switchProfile('legacy-profile');
    const s = useAppStore.getState();

    // Verifica fallback di default storici coerenti
    expect(s.inventory['plastic-parts']).toBe(25);
    expect(s.checkedActions).toEqual({});
    expect(s.completedExpeditionsCount).toBe(0);
    expect(s.earnedPermanentSkillPoints).toBe(0);
    expect(s.consecutiveStreak).toBe(0);
    expect(s.departureWindowActive).toBe(false);
    expect(s.ownedBlueprints).toEqual({});
    expect(s.filterHideCompleted).toBe(true);
    expect(s.filterHideOwnedBlueprints).toBe(false);
    expect(s.activePersonalityId).toBeNull();
  });
});
