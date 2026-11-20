import {
  GAME_MAPS,
  getGameMap as engineGetGameMap,
  getMapName as engineGetMapName,
  type GameMap,
} from '@/engine/maps';

export { GAME_MAPS, type GameMap };

export function getGameMap(id: string): GameMap | undefined {
  return engineGetGameMap(id);
}

/** Nome mostrato di una mappa; per un id sconosciuto ripiega sull'id stesso. */
export function getMapName(id: string): string {
  return engineGetMapName(id);
}
