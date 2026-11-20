import mapsData from '@/data/maps.json';
import questMetadata from '@/data/quest-metadata.json';

export type MapFloor = {
  id: string;
  name: string;
  floorLevel: number;
  layerKey: string;
  isDefault?: boolean;
};

export type MapPoi = {
  id: string;
  mapId: string;
  title: string;
  description?: string;
  coordinate: [number, number];
  category: string;
  floorLevel: number;
  layer: string;
  image?: string;
};

export type GameMap = {
  id: string;
  name: string;
  badge?: string;
  hasMultiFloor?: boolean;
  floors?: MapFloor[];
  totalPois?: number;
};

/**
 * Catalogo globale delle mappe di gioco, definito in `src/data/maps.json`.
 */
export const GAME_MAPS: readonly GameMap[] = mapsData.maps;

export function getGameMap(id: string, maps: readonly GameMap[] = GAME_MAPS): GameMap | undefined {
  return maps.find((m) => m.id === id);
}

/** Nome mostrato di una mappa; per un id sconosciuto ripiega sull'id stesso. */
export function getMapName(id: string, maps: readonly GameMap[] = GAME_MAPS): string {
  return getGameMap(id, maps)?.name ?? id;
}

export function getMapFloors(mapId: string): MapFloor[] {
  switch (mapId) {
    case 'stella-montis':
      return [
        { id: 'stella-montis-l2', name: 'Livello 1 (Lobby)', floorLevel: 0, layerKey: 'stella-montis-l2', isDefault: true },
        { id: 'stella-montis-l1', name: 'Livello 2 (Metro & Vault)', floorLevel: -1, layerKey: 'stella-montis-l1' },
      ];
    case 'spaceport':
      return [
        { id: 'spaceport', name: 'Superficie', floorLevel: 0, layerKey: 'spaceport', isDefault: true },
        { id: 'underground', name: 'Sotterraneo', floorLevel: -1, layerKey: 'underground' },
      ];
    case 'blue-gate':
      return [
        { id: 'blue-gate', name: 'Superficie', floorLevel: 0, layerKey: 'blue-gate', isDefault: true },
        { id: 'underground', name: 'Sotterraneo', floorLevel: -1, layerKey: 'underground' },
      ];
    default:
      return [
        { id: mapId, name: 'Superficie', floorLevel: 0, layerKey: mapId, isDefault: true },
      ];
  }
}

export function coordinateToLatLng(coord: [number, number], mapHeight: number = 4096): [number, number] {
  return [mapHeight - coord[1], coord[0]];
}

export function latLngToCoordinate(latlng: [number, number], mapHeight: number = 4096): [number, number] {
  return [latlng[1], mapHeight - latlng[0]];
}

export function filterPoisByFloor(pois: MapPoi[], floorLayerId: string): MapPoi[] {
  return pois.filter(p => p.layer === floorLayerId || (!p.layer && floorLayerId === 'stella-montis-l2'));
}

export type MacroGroupId = 'fixed' | 'raid' | 'ambient';

export type MacroGroupConfig = {
  id: MacroGroupId;
  labelKey: string;
  descriptionKey: string;
  color: string;
  accentBg: string;
  borderColor: string;
};

export const MACRO_GROUPS: MacroGroupConfig[] = [
  {
    id: 'fixed',
    labelKey: 'maps.groups.fixed',
    descriptionKey: 'maps.groups.fixedDesc',
    color: '#22c55e', // Emerald
    accentBg: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#15803d',
  },
  {
    id: 'raid',
    labelKey: 'maps.groups.raid',
    descriptionKey: 'maps.groups.raidDesc',
    color: '#f59e0b', // Amber
    accentBg: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#b45309',
  },
  {
    id: 'ambient',
    labelKey: 'maps.groups.ambient',
    descriptionKey: 'maps.groups.ambientDesc',
    color: '#a855f7', // Purple/Violet
    accentBg: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#7e22ce',
  },
];

const FIXED_CATEGORIES = new Set([
  'hatch',
  'airshaft',
  'evac',
  'station_evac',
  'infil',
  'entrance',
  'gondola_landing_site',
  'storm_hut',
  'hidden_bunker',
  'locked_room',
  'card_reader',
  'security_locker',
  'locker_red',
  'locker_a',
  'key',
  'download_console',
  'capsule_delivery_terminal',
  'capsule_request_terminal',
  'power_button',
  'access_capacitor_rack',
  'access_capacitor',
  'antenna',
  'gondola_transceiver',
  'launch_tower_event',
  'zipline',
  'zone_nameplate',
]);

const RAID_CATEGORIES = new Set([
  'raider_cache',
  'first_wave_cache',
  'frozen_raider_cache',
  'nomad_cache',
  'buried_container',
  'combat_supplies',
  'supply_station',
  'field_crate',
  'backpack',
  'weapon_case',
  'ammo_crate',
  'utily_crate',
  'med_bag',
  'bountiful_harvest_basket',
  'snitch',
  'sentinel',
  'crashed_arc_probe',
  'arc_courier',
  'arc_probe',
  'arc_assessor',
  'arc-turbine',
  'arc_husk_sm',
  'arc_husk_lg',
  'baron_husk',
  'deforester_husk',
  'frigate_cargo',
  'emperor_payload',
  'emperor_relay',
  'tick',
  'pop',
  'fireball',
  'firefly',
  'comet',
  'leaper',
  'shredder',
  'harvester',
  'turret',
  'wasp',
  'hornet',
  'android',
  'surveyor',
  'rocketeer',
  'vaporizer',
  'bastion',
  'bombardier',
  'skulker',
  'hydra',
  'bully',
  'queen',
  'matriarch',
  'mine',
  'nest',
  'security_camera',
  'quest',
  'project',
]);

export function getCategoryMacroGroup(category: string): MacroGroupId {
  const norm = category.toLowerCase().trim();
  if (FIXED_CATEGORIES.has(norm)) return 'fixed';
  if (RAID_CATEGORIES.has(norm)) return 'raid';
  return 'ambient';
}

const LOCAL_MAP_ICONS = new Set([
  'access_capacitor',
  'access_capacitor_rack',
  'agave',
  'airshaft',
  'ammo_crate',
  'android',
  'antenna',
  'apricot_tree',
  'arc-turbine',
  'arc_assessor',
  'arc_courier',
  'arc_husk_lg',
  'arc_husk_sm',
  'arc_probe',
  'backpack',
  'ballistic_gondola',
  'baron_husk',
  'baron_husk_v2',
  'bastion',
  'bombardier',
  'bountiful_harvest',
  'bountiful_harvest_basket',
  'bully',
  'buried_container',
  'candleberries',
  'capsule_delivery_terminal',
  'capsule_request_terminal',
  'car_alarm',
  'card_reader',
  'combat_supplies',
  'comet',
  'container',
  'crashed_arc_probe',
  'deforester_husk',
  'download_console',
  'emperor_payload',
  'emperor_relay',
  'entrance',
  'evac',
  'fertilizer',
  'field_crate',
  'fireball',
  'firefly',
  'first_wave_cache',
  'frigate_cargo',
  'frozen_raider_cache',
  'fuel_cell',
  'gondola_landing_site',
  'gondola_transceiver',
  'great_mullein',
  'harvester',
  'hatch',
  'hidden_bunker',
  'hornet',
  'hydra',
  'infil',
  'launch_tower_event',
  'launch_tower_loot',
  'leaper',
  'lemon_tree',
  'locked_room',
  'locker_a',
  'locker_red',
  'matriarch',
  'med_bag',
  'medical',
  'metal_detector',
  'mine',
  'moss',
  'mountaineers_detector',
  'mushrooms',
  'nest',
  'nomad_cache',
  'olives',
  'piano',
  'pop',
  'power_button',
  'prickly_pear',
  'project',
  'queen',
  'queen_v2',
  'quest',
  'raider_cache',
  'raider_cache_v2',
  'raider_camp',
  'residential',
  'rocketeer',
  'rocketeer_husk',
  'roots',
  'security_camera',
  'security_locker',
  'sentinel',
  'shredder',
  'skulker',
  'snitch',
  'snow_pile',
  'station_evac',
  'storm_hut',
  'supply-station',
  'supply_station',
  'surveyor',
  'tech',
  'tick',
  'turbine',
  'turret',
  'utility_crate',
  'utily_crate',
  'vaporizer',
  'wasp',
  'wasp_husk',
  'weapon_case',
  'zipline',
]);

const LOOT_TYPE_ICONS = new Set([
  'arc',
  'commercial',
  'electrical',
  'exodus',
  'industrial',
  'mechanical',
  'medical',
  'nature',
  'old-world',
  'residential',
  'security',
  'technological',
  'tech',
]);

export function getCategoryIconPath(category: string, baseUrl: string = '/'): string | null {
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const norm = category.toLowerCase().trim().replace(/_/g, '-');
  const normUnderscore = category.toLowerCase().trim();

  if (normUnderscore === 'quest') {
    return `${cleanBase}icons/map/quest.svg`;
  }

  if (LOCAL_MAP_ICONS.has(normUnderscore)) {
    return `${cleanBase}icons/map/${normUnderscore}.svg`;
  }

  if (LOOT_TYPE_ICONS.has(norm)) {
    const file = norm === 'arc' ? 'ARC.svg' : norm === 'tech' ? 'technological.svg' : `${norm}.svg`;
    return `${cleanBase}icons/loot-types/${file}`;
  }

  if (LOOT_TYPE_ICONS.has(normUnderscore)) {
    return `${cleanBase}icons/loot-types/${normUnderscore}.svg`;
  }

  return null;
}

export type QuestStepInfo = {
  stepNumber: number;
  isSequential: boolean;
  poiId: string;
  description: string;
  coordinate: [number, number];
};

export type QuestGroupInfo = {
  title: string;
  isSequential: boolean;
  isSingleRaid: boolean;
  steps: QuestStepInfo[];
};

export type QuestMetadataMap = Record<string, { isSequential: boolean; isSingleRaid: boolean } | undefined>;

function checkIsSequentialQuest(pois: MapPoi[]): boolean {
  if (pois.length <= 1) return false;

  const descList = pois.map(p => (p.description || '').toLowerCase());

  // 1. Numerazione esplicita negli obiettivi (es. "step 1", "part 2", "1.", "2.")
  const hasExplicitStepNumbers = descList.some(d =>
    /\b(step|part|fase|passo)\s*[1-9]\b/i.test(d) ||
    /^[1-9]\s*[.)-]/m.test(d)
  );
  if (hasExplicitStepNumbers) return true;

  // 2. Sequenza operativa: Preparazione/Riparazione -> poi Attivazione/Consegna/Caricamento
  const hasPrepAction = descList.some(d => /repair|ripara|find|trova|locate|individua|reach|raggiungi|sample|campiona/i.test(d));
  const hasExecAction = descList.some(d => /enable|attiva|power switch|interruttore|activate|flip|accendi|upload|carica|deliver|consegna|hoist|issa|complete|completa/i.test(d));
  if (hasPrepAction && hasExecAction) return true;

  return false;
}

export function groupQuestPoisByQuest(
  pois: MapPoi[],
  metadata: QuestMetadataMap = questMetadata as QuestMetadataMap,
): QuestGroupInfo[] {
  const questPois = pois.filter(p => p.category === 'quest');
  const byTitle = new Map<string, MapPoi[]>();

  for (const poi of questPois) {
    const title = poi.title.trim() || 'Quest';
    const list = byTitle.get(title) ?? [];
    list.push(poi);
    byTitle.set(title, list);
  }

  const result: QuestGroupInfo[] = [];

  for (const [title, items] of byTitle.entries()) {
    const cleanTitle = title.replace(/\s*\(\d+\/\d+\)\s*$/i, '').trim();
    const meta = metadata[title] ?? metadata[cleanTitle];

    const isSequential = meta?.isSequential ?? checkIsSequentialQuest(items);
    const isSingleRaid = meta?.isSingleRaid ?? false;

    const steps: QuestStepInfo[] = items.map((poi, idx) => ({
      stepNumber: idx + 1,
      isSequential,
      poiId: poi.id,
      description: poi.description || poi.title,
      coordinate: poi.coordinate,
    }));

    result.push({
      title,
      isSequential,
      isSingleRaid,
      steps,
    });
  }

  return result.sort((a, b) => a.title.localeCompare(b.title));
}

export function isPriorityPoi(poi: MapPoi): boolean {
  const norm = poi.category.toLowerCase().trim();
  return (
    norm === 'quest' ||
    norm === 'hatch' ||
    norm === 'airshaft' ||
    norm === 'evac' ||
    norm === 'station_evac'
  );
}

export function isMajorNameplate(icons?: string[]): boolean {
  return Array.isArray(icons) && icons.length > 0;
}

export type PoiCluster = {
  id: string;
  center: [number, number];
  count: number;
  points: MapPoi[];
  categories: Record<string, number>;
};

export type ClusterResult = {
  priorityPois: MapPoi[];
  singlePois: MapPoi[];
  clusters: PoiCluster[];
};

export function clusterPoisByGrid(
  pois: MapPoi[],
  projectToScreen: (coord: [number, number]) => { x: number; y: number },
  pixelRadius: number = 42
): ClusterResult {
  const priorityPois: MapPoi[] = [];
  const clusterCandidates: MapPoi[] = [];

  for (const p of pois) {
    if (isPriorityPoi(p)) {
      priorityPois.push(p);
    } else {
      clusterCandidates.push(p);
    }
  }

  const grid = new Map<string, { poi: MapPoi; screenX: number; screenY: number }[]>();

  for (const poi of clusterCandidates) {
    const screen = projectToScreen(poi.coordinate);
    const gx = Math.floor(screen.x / pixelRadius);
    const gy = Math.floor(screen.y / pixelRadius);
    const key = `${gx}_${gy}`;
    const list = grid.get(key) ?? [];
    list.push({ poi, screenX: screen.x, screenY: screen.y });
    grid.set(key, list);
  }

  const singlePois: MapPoi[] = [];
  const clusters: PoiCluster[] = [];

  for (const [key, items] of grid.entries()) {
    if (items.length === 1) {
      singlePois.push(items[0].poi);
    } else {
      const avgX = items.reduce((sum, item) => sum + item.poi.coordinate[0], 0) / items.length;
      const avgY = items.reduce((sum, item) => sum + item.poi.coordinate[1], 0) / items.length;

      const categories: Record<string, number> = {};
      for (const item of items) {
        categories[item.poi.category] = (categories[item.poi.category] || 0) + 1;
      }

      clusters.push({
        id: `cluster-${key}-${items.length}`,
        center: [avgX, avgY],
        count: items.length,
        points: items.map(i => i.poi),
        categories,
      });
    }
  }

  return { priorityPois, singlePois, clusters };
}
