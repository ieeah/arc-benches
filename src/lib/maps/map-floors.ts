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
