import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface MapViewerProps {
  mapId: string;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

const MAP_CENTERS: Record<string, [number, number]> = {
  'buried-city': [0.7158, -0.8273],
  'dam-battlegrounds': [0.55, -0.65],
  'spaceport': [0.68, -0.75],
  'the-blue-gate': [0.65, -0.70],
  'stella-montis': [0.70, -0.72],
  'riven-tides': [0.60, -0.68],
};

const MAP_TILE_PATHS: Record<string, string> = {
  'buried-city': 'arc-raiders/buried-city/default-v4',
  'dam-battlegrounds': 'arc-raiders/dam-battlegrounds/default-v2',
  'spaceport': 'arc-raiders/spaceport/default-v2',
  'the-blue-gate': 'arc-raiders/the-blue-gate/default-v5',
  'stella-montis': 'arc-raiders/stella-montis/default-v1',
  'riven-tides': 'arc-raiders/riven-tides/default-v1',
};

export const MapViewer = ({
  mapId,
  minZoom = 8,
  maxZoom = 12,
  className = '',
}: MapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(minZoom + 2);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inizializzazione Leaflet
  useEffect(() => {
    if (!containerRef.current) return;

    // Se esiste già una mappa, distruggila prima di riallocarla
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const center = MAP_CENTERS[mapId] ?? [0, 0];
    const initialZoom = 10;

    const map = L.map(containerRef.current, {
      center,
      zoom: initialZoom,
      minZoom,
      maxZoom: maxZoom + 2, // Permette un po' di overzoom
      zoomControl: false,
      attributionControl: false,
      maxBoundsViscosity: 0.8,
    });

    const tilePath = MAP_TILE_PATHS[mapId] ?? `arc-raiders/${mapId}/default-v1`;
    const tileUrl = `https://tiles.mapgenie.io/games/${tilePath}/{z}/{y}/{x}.jpg`;

    const tiles = L.tileLayer(tileUrl, {
      minZoom,
      maxZoom: maxZoom + 2,
      maxNativeZoom: maxZoom,
      noWrap: true,
      bounds: [
        [-85, -180],
        [85, 180],
      ],
    }).addTo(map);

    tileLayerRef.current = tiles;
    mapInstanceRef.current = map;
    setCurrentZoom(map.getZoom());

    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoom);

    // Adatta la dimensione al container
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.off('zoomend', handleZoom);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapId, minZoom, maxZoom]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleReset = () => {
    const center = MAP_CENTERS[mapId] ?? [0, 0];
    mapInstanceRef.current?.setView(center, 10, { animate: true });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);
  };

  return (
    <div
      className={`relative overflow-hidden bg-gray-950 border border-gray-800 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : 'w-full h-[65vh] min-h-[420px] rounded-[24px] shadow-xl'
      } ${className}`}
    >
      {/* Contenitore Leaflet */}
      <div ref={containerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Controlli Flottanti Mappa (Zoom & Azioni) */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="flex flex-col bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-800 p-1 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-xl transition-colors cursor-pointer active:scale-95"
            title="Ingrandisci"
            aria-label="Ingrandisci"
          >
            <ZoomIn size={18} />
          </button>
          <div className="h-px bg-gray-800 my-0.5 mx-1" />
          <button
            onClick={handleZoomOut}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-xl transition-colors cursor-pointer active:scale-95"
            title="Riduci"
            aria-label="Riduci"
          >
            <ZoomOut size={18} />
          </button>
        </div>

        <div className="flex flex-col bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-800 p-1 shadow-lg">
          <button
            onClick={handleReset}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-xl transition-colors cursor-pointer active:scale-95"
            title="Centra Mappa"
            aria-label="Centra Mappa"
          >
            <RotateCcw size={18} />
          </button>
          <div className="h-px bg-gray-800 my-0.5 mx-1" />
          <button
            onClick={toggleFullscreen}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-gray-800/80 rounded-xl transition-colors cursor-pointer active:scale-95"
            title={isFullscreen ? 'Riduci' : 'Schermo Intero'}
            aria-label="Schermo Intero"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Badge Livello Zoom & Info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-800 shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold text-gray-300">
            Lvl Zoom: {currentZoom}
          </span>
        </div>
      </div>
    </div>
  );
};
