import mapsData from '@/data/maps.json';

export interface GameMap {
  id: string;
  name: string;
  badge?: string;
}

/**
 * Catalogo globale delle mappe di gioco, definito una sola volta in `src/data/maps.json`.
 * Chi referenzia mappe (azioni delle liste, pagina Mappe, in futuro spawn tip e raggruppamenti)
 * ne usa un sottoinsieme proprio: i sottoinsiemi non sono condivisi tra funzioni diverse.
 */
export const GAME_MAPS: readonly GameMap[] = mapsData.maps;

export function getGameMap(id: string): GameMap | undefined {
  return GAME_MAPS.find((m) => m.id === id);
}

/** Nome mostrato di una mappa; per un id sconosciuto ripiega sull'id stesso. */
export function getMapName(id: string): string {
  return getGameMap(id)?.name ?? id;
}
