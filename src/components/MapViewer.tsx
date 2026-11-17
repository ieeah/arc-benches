import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Layers } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { getMapFloors, type MapFloor, type MapPoi } from '@/lib/maps/map-floors';
import mapPoisData from '@/data/map-pois.json';

type MapViewerProps = {
  mapId: string;
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
  className?: string;
};

const CATEGORY_COLORS: Record<string, { fill: string; stroke: string }> = {
  raider_cache: { fill: '#f59e0b', stroke: '#b45309' },
  first_wave_cache: { fill: '#f59e0b', stroke: '#b45309' },
  frozen_raider_cache: { fill: '#f59e0b', stroke: '#b45309' },
  ammo_crate: { fill: '#fbbf24', stroke: '#d97706' },
  weapon_crate: { fill: '#f97316', stroke: '#c2410c' },
  medical: { fill: '#10b981', stroke: '#047857' },
  moss: { fill: '#10b981', stroke: '#047857' },
  candleberries: { fill: '#34d399', stroke: '#059669' },
  great_mullein: { fill: '#34d399', stroke: '#059669' },
  prickly_pear: { fill: '#34d399', stroke: '#059669' },
  electrical: { fill: '#0284c7', stroke: '#0369a1' },
  tech: { fill: '#38bdf8', stroke: '#0284c7' },
  industrial: { fill: '#ea580c', stroke: '#9a3412' },
  mechanical: { fill: '#f97316', stroke: '#c2410c' },
  residential: { fill: '#8b5cf6', stroke: '#6d28d9' },
  commercial: { fill: '#a855f7', stroke: '#7e22ce' },
  arc_courier: { fill: '#f43f5e', stroke: '#be123c' },
  crashed_arc_probe: { fill: '#f43f5e', stroke: '#be123c' },
  snitch: { fill: '#e11d48', stroke: '#9f1239' },
  sentinel: { fill: '#e11d48', stroke: '#9f1239' },
  hatch: { fill: '#22c55e', stroke: '#15803d' },
  airshaft: { fill: '#22c55e', stroke: '#15803d' },
  extraction: { fill: '#22c55e', stroke: '#15803d' },
  key: { fill: '#eab308', stroke: '#a16207' },
  other: { fill: '#94a3b8', stroke: '#64748b' },
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTileUrl(mapId: string, floor: MapFloor): string {
  const isDev = import.meta.env.DEV;
  const baseUrl = import.meta.env.BASE_URL || '/';

  if (mapId === 'stella-montis') {
    if (isDev) {
      const tileDir = floor.id === 'stella-montis-l1' ? 'stella-montis-l1' : 'stella-montis-l2';
      return `${baseUrl}__dev-maps/${tileDir}/{z}/{x}/{y}.webp`;
    }
    const layerPath = floor.id === 'stella-montis-l1' ? 'stella-montis-lower' : 'stella-montis-upper';
    return `https://arcraidersmaps.app/static/maps/v2/stella-montis/layers/${layerPath}/tiles/{z}/{x}/{y}.webp`;
  }

  if (mapId === 'spaceport') {
    return 'https://arcraidersmaps.app/static/maps/v2/spaceport/layers/surface/tiles/{z}/{x}/{y}.webp';
  }

  if (mapId === 'blue-gate') {
    return 'https://arcraidersmaps.app/static/maps/v2/blue-gate/layers/surface/tiles/{z}/{x}/{y}.webp';
  }

  if (mapId === 'dam') {
    return 'https://arcraidersmaps.app/static/maps/v2/dam/layers/surface/tiles/{z}/{x}/{y}.webp';
  }

  if (mapId === 'buried-city') {
    return 'https://arcraidersmaps.app/static/maps/v2/buried-city/layers/surface/tiles/{z}/{x}/{y}.webp';
  }

  if (mapId === 'riven-tides') {
    return 'https://arcraidersmaps.app/static/maps/v2/riven-tides/layers/surface/tiles/{z}/{x}/{y}.webp';
  }

  if (mapId === 'pendola-pass') {
    return 'https://arcraidersmaps.app/static/maps/pendola-pass/layers/surface/tiles/{z}/{x}/{y}.webp';
  }

  return `https://arcraidersmaps.app/static/maps/v2/${mapId}/layers/surface/tiles/{z}/{x}/{y}.webp`;
}

export const MapViewer = ({
  mapId,
  minZoom = 1,
  maxZoom = 5,
  defaultZoom = 2,
  className = '',
}: MapViewerProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  const availableFloors = useMemo(() => getMapFloors(mapId), [mapId]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');

  const currentFloor = useMemo(() => {
    return availableFloors.find(f => f.id === selectedFloorId) ?? availableFloors[0];
  }, [availableFloors, selectedFloorId]);

  const [currentZoom, setCurrentZoom] = useState<number>(defaultZoom);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inizializzazione della mappa Leaflet con CRS.Simple
  useEffect(() => {
    if (!containerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      zoom: defaultZoom,
      minZoom,
      maxZoom,
      zoomControl: false,
      attributionControl: false,
      maxBoundsViscosity: 0.9,
    });

    // In CRS.Simple con scala 512 a zoom 3: l'immagine 4096x4096 va da (0,0) a (4096, 4096)
    const southWest = map.unproject([0, 4096], 3);
    const northEast = map.unproject([4096, 0], 3);
    const bounds = new L.LatLngBounds(southWest, northEast);
    const center = map.unproject([2048, 2048], 3);

    map.setMaxBounds(bounds.pad(0.3));
    map.setView(center, defaultZoom);

    const initialFloor = availableFloors[0];
    const tileUrl = getTileUrl(mapId, initialFloor);

    const tiles = L.tileLayer(tileUrl, {
      tileSize: 512,
      minZoom,
      maxZoom,
      maxNativeZoom: 3,
      noWrap: true,
      bounds,
    }).addTo(map);

    tileLayerRef.current = tiles;

    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;

    mapInstanceRef.current = map;
    setCurrentZoom(map.getZoom());

    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoom);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.off('zoomend', handleZoom);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markerGroupRef.current = null;
    };
  }, [mapId, minZoom, maxZoom, defaultZoom, availableFloors]);

  // Aggiornamento Tile Layer al cambio piano (senza toccare pan o zoom)
  useEffect(() => {
    if (tileLayerRef.current) {
      const newUrl = getTileUrl(mapId, currentFloor);
      tileLayerRef.current.setUrl(newUrl);
    }
  }, [mapId, currentFloor]);

  // Aggiornamento dei POI Markers al cambio piano o mappa
  const visiblePois = useMemo(() => {
    const rawPois = (mapPoisData.pois || []) as (MapPoi & { categoryTitle?: string })[];
    return rawPois.filter(p => {
      if (p.mapId !== mapId) return false;
      if (availableFloors.length <= 1) return true;
      return p.layer === currentFloor.layerKey;
    });
  }, [mapId, currentFloor, availableFloors]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();

    visiblePois.forEach(poi => {
      if (!poi.coordinate || poi.coordinate.length < 2) return;
      // Proiezione CRS.Simple da coordinate [x, y] in pixels a LatLng
      const latLng = map.unproject([poi.coordinate[0], poi.coordinate[1]], 3);

      const color = CATEGORY_COLORS[poi.category] || CATEGORY_COLORS.other;
      const marker = L.circleMarker(latLng, {
        radius: 5,
        fillColor: color.fill,
        color: color.stroke,
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      const descSection = poi.description
        ? `<div style="color: #4b5563; font-size: 11px; margin-top: 4px; max-height: 100px; overflow-y: auto; white-space: pre-line;">
             ${escapeHtml(poi.description)}
           </div>`
        : '';

      const imageSection = poi.image
        ? `<div style="margin-top: 6px; border-radius: 6px; overflow: hidden;">
             <img src="https://arcraidersmaps.app${escapeHtml(poi.image)}" alt="${escapeHtml(poi.title)}" style="width: 100%; height: auto; max-height: 120px; object-fit: cover;" loading="lazy" onerror="this.parentElement.style.display='none'" />
           </div>`
        : '';

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1f2937; min-width: 160px; max-width: 240px;">
          <div style="font-weight: 700; margin-bottom: 4px; font-size: 13px;">${escapeHtml(poi.title)}</div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; background: #e5e7eb; margin-bottom: 4px;">
            ${escapeHtml(poi.category.replace(/_/g, ' '))}
          </div>
          ${descSection}
          ${imageSection}
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });
      markerGroupRef.current?.addLayer(marker);
    });
  }, [visiblePois]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleReset = () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.unproject([2048, 2048], 3);
    mapInstanceRef.current.setView(center, defaultZoom, { animate: true });
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
          ? 'fixed inset-0 z-50 rounded-none w-screen h-dvh'
          : 'w-full h-[65dvh] min-h-[420px] rounded-[24px] shadow-xl'
      } ${className}`}
      style={{ backgroundColor: '#030712' }}
    >
      {/* Reset background di Leaflet per garantire che il canvas sia sempre scuro */}
      <style>{`
        .leaflet-container {
          background-color: #030712 !important;
        }
        .leaflet-tile-pane, .leaflet-tile-container {
          background-color: #030712 !important;
        }
        .leaflet-tile {
          image-rendering: auto;
        }
      `}</style>

      {/* Contenitore Leaflet */}
      <div
        ref={containerRef}
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing !bg-gray-950"
        style={{ backgroundColor: '#030712' }}
      />

      {/* Selettore Piano (Floor Switcher) Flottante al centro in alto */}
      {availableFloors.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-md p-1 rounded-full border border-gray-800 shadow-xl">
            <span className="pl-2 pr-1 text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <Layers size={13} />
              <span>{t('maps.floor')}:</span>
            </span>
            {availableFloors.map(floor => {
              const isActive = floor.id === currentFloor.id;
              return (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => setSelectedFloorId(floor.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`}
                >
                  {floor.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Badge Informativo in alto a sinistra (Zoom & Conteggio POI) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900/85 backdrop-blur-md border border-gray-800 text-[11px] font-semibold text-gray-300 shadow-md">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Zoom: {currentZoom}</span>
        </div>
        <div className="px-2.5 py-0.5 rounded-full bg-gray-900/85 backdrop-blur-md border border-gray-800 text-[10px] font-medium text-gray-400 shadow-sm">
          {visiblePois.length} POIs visible
        </div>
      </div>

      {/* Controlli Flottanti in basso a destra */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label={t('maps.zoomIn')}
          className="size-10 rounded-2xl bg-gray-900/90 backdrop-blur-md border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 active:scale-95 flex items-center justify-center transition-all shadow-lg cursor-pointer"
        >
          <ZoomIn size={18} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label={t('maps.zoomOut')}
          className="size-10 rounded-2xl bg-gray-900/90 backdrop-blur-md border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 active:scale-95 flex items-center justify-center transition-all shadow-lg cursor-pointer"
        >
          <ZoomOut size={18} />
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label={t('maps.resetCenter')}
          className="size-10 rounded-2xl bg-gray-900/90 backdrop-blur-md border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 active:scale-95 flex items-center justify-center transition-all shadow-lg cursor-pointer"
        >
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? t('maps.exitFullscreen') : t('maps.fullscreen')}
          className="size-10 rounded-2xl bg-gray-900/90 backdrop-blur-md border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 active:scale-95 flex items-center justify-center transition-all shadow-lg cursor-pointer"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};
