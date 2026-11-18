import { describe, it, expect } from 'vitest';
import {
  getCategoryMacroGroup,
  MACRO_GROUPS,
  groupQuestPoisByQuest,
  isPriorityPoi,
  isMajorNameplate,
  clusterPoisByGrid,
} from './map-filters';
import type { MapPoi } from './map-floors';

describe('map-filters logic', () => {
  it('categorizes POIs into the 3 macro groups correctly', () => {
    // Fixed points & structures
    expect(getCategoryMacroGroup('hatch')).toBe('fixed');
    expect(getCategoryMacroGroup('airshaft')).toBe('fixed');
    expect(getCategoryMacroGroup('locked_room')).toBe('fixed');
    expect(getCategoryMacroGroup('download_console')).toBe('fixed');

    // Raid loot & objectives
    expect(getCategoryMacroGroup('raider_cache')).toBe('raid');
    expect(getCategoryMacroGroup('weapon_case')).toBe('raid');
    expect(getCategoryMacroGroup('ammo_crate')).toBe('raid');
    expect(getCategoryMacroGroup('snitch')).toBe('raid');
    expect(getCategoryMacroGroup('quest')).toBe('raid');

    // Ambient resources & gathering (never called "rumore")
    expect(getCategoryMacroGroup('moss')).toBe('ambient');
    expect(getCategoryMacroGroup('candleberries')).toBe('ambient');
    expect(getCategoryMacroGroup('great_mullein')).toBe('ambient');
    expect(getCategoryMacroGroup('electrical')).toBe('ambient');
    expect(getCategoryMacroGroup('residential')).toBe('ambient');
  });

  it('defines the 3 macro groups with appropriate metadata', () => {
    expect(MACRO_GROUPS).toHaveLength(3);
    const ids = MACRO_GROUPS.map(g => g.id);
    expect(ids).toEqual(['fixed', 'raid', 'ambient']);
  });

  it('identifies priority POIs (quests and extractions) that should never be clustered', () => {
    expect(isPriorityPoi({ category: 'quest' } as MapPoi)).toBe(true);
    expect(isPriorityPoi({ category: 'hatch' } as MapPoi)).toBe(true);
    expect(isPriorityPoi({ category: 'airshaft' } as MapPoi)).toBe(true);
    expect(isPriorityPoi({ category: 'evac' } as MapPoi)).toBe(true);
    expect(isPriorityPoi({ category: 'ammo_crate' } as MapPoi)).toBe(false);
    expect(isPriorityPoi({ category: 'electrical' } as MapPoi)).toBe(false);
  });

  it('distinguishes major nameplates (Level 1, with loot icons) from secondary ones (Level 2)', () => {
    expect(isMajorNameplate(['technological.svg'])).toBe(true);
    expect(isMajorNameplate(['security.svg', 'industrial.svg'])).toBe(true);
    expect(isMajorNameplate([])).toBe(false);
  });

  it('clusters close non-priority points into clusters while preserving priority points as singles', () => {
    const mockPois: MapPoi[] = [
      { id: 'q-1', mapId: 'dam', title: 'Quest', coordinate: [100, 100], category: 'quest', floorLevel: 0, layer: 'dam' },
      { id: 'c-1', mapId: 'dam', title: 'Crate 1', coordinate: [500, 500], category: 'ammo_crate', floorLevel: 0, layer: 'dam' },
      { id: 'c-2', mapId: 'dam', title: 'Crate 2', coordinate: [510, 505], category: 'weapon_case', floorLevel: 0, layer: 'dam' },
      { id: 'c-3', mapId: 'dam', title: 'Crate 3', coordinate: [505, 510], category: 'med_bag', floorLevel: 0, layer: 'dam' },
      { id: 'solo-1', mapId: 'dam', title: 'Solo Crate', coordinate: [2000, 2000], category: 'ammo_crate', floorLevel: 0, layer: 'dam' },
    ];

    // Projector mapping [x, y] to screen coordinates (1:1 for test)
    const project = (coord: [number, number]) => ({ x: coord[0], y: coord[1] });

    const result = clusterPoisByGrid(mockPois, project, 50);

    // Quest is priority -> in priorityPois
    expect(result.priorityPois).toHaveLength(1);
    expect(result.priorityPois[0].id).toBe('q-1');

    // C-1, C-2, C-3 are within 50px -> clustered into 1 cluster
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0].count).toBe(3);
    expect(result.clusters[0].categories['ammo_crate']).toBe(1);
    expect(result.clusters[0].categories['weapon_case']).toBe(1);
    expect(result.clusters[0].categories['med_bag']).toBe(1);

    // Solo-1 is alone -> in singlePois
    expect(result.singlePois).toHaveLength(1);
    expect(result.singlePois[0].id).toBe('solo-1');
  });

  it('groups quest POIs by quest title and assigns 1-based sequential step numbers', () => {
    const mockPois = [
      {
        id: 'poi-1',
        mapId: 'dam',
        title: 'Flickering Threat',
        description: 'Repair the Generator',
        coordinate: [2425, 2826] as [number, number],
        category: 'quest',
        floorLevel: 0,
        layer: 'dam',
      },
      {
        id: 'poi-2',
        mapId: 'dam',
        title: 'Flickering Threat',
        description: 'Enable the power switch',
        coordinate: [2576, 2811] as [number, number],
        category: 'quest',
        floorLevel: 0,
        layer: 'dam',
      },
      {
        id: 'poi-3',
        mapId: 'dam',
        title: "Celeste's Journals",
        description: 'Retrieve North Journal',
        coordinate: [2930, 2784] as [number, number],
        category: 'quest',
        floorLevel: 0,
        layer: 'dam',
      },
    ];

    const grouped = groupQuestPoisByQuest(mockPois);
    expect(grouped).toHaveLength(2);

    const flickering = grouped.find(q => q.title === 'Flickering Threat');
    expect(flickering).toBeDefined();
    expect(flickering?.isSequential).toBe(true);
    expect(flickering?.steps).toHaveLength(2);
    expect(flickering?.steps[0].stepNumber).toBe(1);
    expect(flickering?.steps[0].isSequential).toBe(true);
    expect(flickering?.steps[0].poiId).toBe('poi-1');
    expect(flickering?.steps[1].stepNumber).toBe(2);
    expect(flickering?.steps[1].isSequential).toBe(true);
    expect(flickering?.steps[1].poiId).toBe('poi-2');

    const celeste = grouped.find(q => q.title === "Celeste's Journals");
    expect(celeste?.steps).toHaveLength(1);
    expect(celeste?.isSequential).toBe(false);
    expect(celeste?.isSingleRaid).toBe(true);
    expect(celeste?.steps[0].stepNumber).toBe(1);
    expect(celeste?.steps[0].isSequential).toBe(false);
  });

  it('detects parallel non-sequential quests with simultaneous objectives', () => {
    const mockPois = [
      {
        id: 'div-1',
        mapId: 'pendola-pass',
        title: 'Divided',
        description: 'Search for the Nomad recording at Loading Platforms',
        coordinate: [1000, 1000] as [number, number],
        category: 'quest',
        floorLevel: 0,
        layer: 'surface',
      },
      {
        id: 'div-2',
        mapId: 'pendola-pass',
        title: 'Divided',
        description: 'Search for the Nomad recording at Weather Station',
        coordinate: [1200, 1200] as [number, number],
        category: 'quest',
        floorLevel: 0,
        layer: 'surface',
      },
    ];

    const grouped = groupQuestPoisByQuest(mockPois);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].isSequential).toBe(false);
    expect(grouped[0].steps[0].isSequential).toBe(false);
    expect(grouped[0].steps[1].isSequential).toBe(false);
  });
});
