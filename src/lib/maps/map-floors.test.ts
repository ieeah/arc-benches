import { describe, it, expect } from 'vitest';
import {
  getMapFloors,
  filterPoisByFloor,
  coordinateToLatLng,
  latLngToCoordinate,
  type MapPoi,
} from './map-floors';

describe('map-floors module (CRS.Simple / arcraidersmaps)', () => {
  describe('getMapFloors', () => {
    it('returns exact floor layers for Stella Montis', () => {
      const floors = getMapFloors('stella-montis');
      expect(floors).toHaveLength(2);
      expect(floors[0].id).toBe('stella-montis-l2');
      expect(floors[0].name).toBe('Livello 1 (Lobby)');
      expect(floors[1].id).toBe('stella-montis-l1');
      expect(floors[1].name).toBe('Livello 2 (Metro & Vault)');
    });

    it('returns surface and underground floors for Spaceport and Blue Gate', () => {
      const spaceportFloors = getMapFloors('spaceport');
      expect(spaceportFloors).toHaveLength(2);
      expect(spaceportFloors[0].id).toBe('spaceport');
      expect(spaceportFloors[1].id).toBe('underground');

      const blueGateFloors = getMapFloors('blue-gate');
      expect(blueGateFloors).toHaveLength(2);
      expect(blueGateFloors[0].id).toBe('blue-gate');
      expect(blueGateFloors[1].id).toBe('underground');
    });

    it('returns a single default surface floor for single-level maps', () => {
      const damFloors = getMapFloors('dam');
      expect(damFloors).toHaveLength(1);
      expect(damFloors[0].id).toBe('dam');
    });
  });

  describe('coordinate projection (CRS.Simple 4096x4096)', () => {
    it('projects [x, y] to Leaflet [lat, lng] accurately', () => {
      // In 4096x4096 CRS.Simple:
      // Top-left is [0, 0] -> lat = 4096, lng = 0
      // Bottom-right is [4096, 4096] -> lat = 0, lng = 4096
      // Point [X=1717.84, Y=2233.62] -> lat = 4096 - 2233.62, lng = 1717.84
      expect(coordinateToLatLng([0, 0])).toEqual([4096, 0]);
      expect(coordinateToLatLng([4096, 4096])).toEqual([0, 4096]);
      expect(coordinateToLatLng([1717.84, 2233.62])).toEqual([4096 - 2233.62, 1717.84]);
    });

    it('inverts Leaflet [lat, lng] back to [x, y] coordinate accurately', () => {
      const originalCoord: [number, number] = [1717.84, 2233.62];
      const latlng = coordinateToLatLng(originalCoord);
      const inverted = latLngToCoordinate(latlng);
      expect(inverted[0]).toBeCloseTo(originalCoord[0], 5);
      expect(inverted[1]).toBeCloseTo(originalCoord[1], 5);
    });
  });

  describe('filterPoisByFloor', () => {
    it('filters POIs strictly matching the chosen floor layer', () => {
      const pois: MapPoi[] = [
        {
          id: '1',
          mapId: 'stella-montis',
          title: 'Lobby Safe',
          coordinate: [2000, 1500],
          category: 'vault',
          floorLevel: 0,
          layer: 'stella-montis-l2',
        },
        {
          id: '2',
          mapId: 'stella-montis',
          title: 'Metro Terminal',
          coordinate: [2100, 1600],
          category: 'terminal',
          floorLevel: -1,
          layer: 'stella-montis-l1',
        },
      ];

      const l2Pois = filterPoisByFloor(pois, 'stella-montis-l2');
      expect(l2Pois).toHaveLength(1);
      expect(l2Pois[0].id).toBe('1');

      const l1Pois = filterPoisByFloor(pois, 'stella-montis-l1');
      expect(l1Pois).toHaveLength(1);
      expect(l1Pois[0].id).toBe('2');
    });
  });
});
