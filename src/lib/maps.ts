import mapsData from '@/data/maps.json';
import type { MapFloor } from './maps/map-floors';

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

export function getGameMap(id: string): GameMap | undefined {
  return GAME_MAPS.find((m) => m.id === id);
}

/** Nome mostrato di una mappa; per un id sconosciuto ripiega sull'id stesso. */
export function getMapName(id: string): string {
  return getGameMap(id)?.name ?? id;
}
