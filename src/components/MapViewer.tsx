import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Layers, Filter } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { getMapFloors, type MapFloor, type MapPoi } from '@/lib/maps/map-floors';
import {
  MACRO_GROUPS,
  getCategoryMacroGroup,
  getCategoryIconPath,
  groupQuestPoisByQuest,
  isMajorNameplate,
  clusterPoisByGrid,
} from '@/lib/maps/map-filters';
import { MapPoiFilterDrawer } from '@/components/maps/MapPoiFilterDrawer';
import mapPoisData from '@/data/map-pois.json';
import mapNameplatesData from '@/data/map-nameplates.json';
import mapAreasData from '@/data/map-areas.json';

type MapViewerProps = {
  mapId: string;
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
  className?: string;
};

type ZoneNameplate = {
  title: string;
  coordinate: [number, number];
  layer?: string;
  icons: string[];
};

type LootArea = {
  color: string;
  tier: 'high' | 'medium' | 'dynamic';
  layer: string;
  vertexes: [number, number][];
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
  minZoom = 0,
  maxZoom = 6,
  defaultZoom = 1,
  className = '',
}: MapViewerProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const nameplateGroupRef = useRef<L.LayerGroup | null>(null);
  const areaGroupRef = useRef<L.LayerGroup | null>(null);

  const availableFloors = useMemo(() => getMapFloors(mapId), [mapId]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');

  const currentFloor = useMemo(() => {
    return availableFloors.find(f => f.id === selectedFloorId) ?? availableFloors[0];
  }, [availableFloors, selectedFloorId]);

  const [currentZoom, setCurrentZoom] = useState<number>(defaultZoom);
  const [viewportBounds, setViewportBounds] = useState<L.LatLngBounds | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Filter States: Disattiva di DEFAULT il Gruppo 3 (Risorse Ambientali & Raccolta)
  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(() => {
    const initialDisabled = new Set<string>();
    const rawPois = (mapPoisData.pois || []) as MapPoi[];
    for (const p of rawPois) {
      if (getCategoryMacroGroup(p.category) === 'ambient') {
        initialDisabled.add(p.category);
      }
    }
    return initialDisabled;
  });

  const [disabledQuestTitles, setDisabledQuestTitles] = useState<Set<string>>(new Set());
  const [showZoneNameplates, setShowZoneNameplates] = useState<boolean>(true);
  const [showLootAreas, setShowLootAreas] = useState<boolean>(true);

  // Inizializzazione della mappa Leaflet con CRS.Simple
  useEffect(() => {
    if (!containerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    containerRef.current.style.backgroundColor = '#030712';

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      zoom: defaultZoom,
      minZoom,
      maxZoom,
      zoomControl: false,
      attributionControl: false,
      maxBoundsViscosity: 0.9,
    });

    map.getContainer().style.backgroundColor = '#030712';

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

    const areasLayer = L.layerGroup().addTo(map);
    areaGroupRef.current = areasLayer;

    const nameplates = L.layerGroup().addTo(map);
    nameplateGroupRef.current = nameplates;

    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;

    mapInstanceRef.current = map;
    setCurrentZoom(map.getZoom());
    setViewportBounds(map.getBounds());

    const handleViewChange = () => {
      setCurrentZoom(map.getZoom());
      setViewportBounds(map.getBounds());
    };

    map.on('moveend', handleViewChange);

    const timer = setTimeout(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
        setViewportBounds(map.getBounds());
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      map.off('moveend', handleViewChange);
      markerGroupRef.current?.clearLayers();
      nameplateGroupRef.current?.clearLayers();
      areaGroupRef.current?.clearLayers();
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markerGroupRef.current = null;
      nameplateGroupRef.current = null;
      areaGroupRef.current = null;
    };
  }, [mapId, minZoom, maxZoom, defaultZoom, availableFloors]);

  // Aggiornamento Tile Layer al cambio piano (senza toccare pan o zoom)
  useEffect(() => {
    if (tileLayerRef.current) {
      const newUrl = getTileUrl(mapId, currentFloor);
      tileLayerRef.current.setUrl(newUrl);
    }
  }, [mapId, currentFloor]);

  // POI grezzi sul piano corrente
  const floorPois = useMemo(() => {
    const rawPois = (mapPoisData.pois || []) as (MapPoi & { categoryTitle?: string })[];
    return rawPois.filter(p => {
      if (p.mapId !== mapId) return false;
      if (availableFloors.length <= 1) return true;
      return p.layer === currentFloor.layerKey;
    });
  }, [mapId, currentFloor, availableFloors]);

  // Mappatura step quest
  const questGroups = useMemo(() => groupQuestPoisByQuest(floorPois), [floorPois]);

  const questStepMap = useMemo(() => {
    const map = new Map<string, { stepNumber: number; totalSteps: number; isSequential: boolean; questTitle: string }>();
    for (const q of questGroups) {
      for (const step of q.steps) {
        map.set(step.poiId, {
          stepNumber: step.stepNumber,
          totalSteps: q.steps.length,
          isSequential: q.isSequential,
          questTitle: q.title,
        });
      }
    }
    return map;
  }, [questGroups]);

  // POI filtrati in base alle selezioni dell'utente
  const filteredPois = useMemo(() => {
    return floorPois.filter(poi => {
      // 1. Le quest sono governate esclusivamente dal tab Missioni (disabledQuestTitles)
      if (poi.category === 'quest') {
        const title = poi.title.trim();
        return !disabledQuestTitles.has(title);
      }
      // 2. Tutte le altre categorie sono governate dal tab Categorie (disabledCategories)
      if (disabledCategories.has(poi.category)) return false;
      return true;
    });
  }, [floorPois, disabledCategories, disabledQuestTitles]);

  // Viewport Culling con buffer di tolleranza esterno (pad 0.45)
  const culledPois = useMemo(() => {
    if (!mapInstanceRef.current || !viewportBounds) return filteredPois;
    const padded = viewportBounds.pad(0.45);
    return filteredPois.filter(p => {
      const latLng = mapInstanceRef.current!.unproject([p.coordinate[0], p.coordinate[1]], 3);
      return padded.contains(latLng);
    });
  }, [filteredPois, viewportBounds]);

  // Zone Nameplates con LOD a 2 livelli:
  // Livello 1 (Major Nameplates, con icone loot): sempre visibili
  // Livello 2 (Secondary Nameplates, senza icone): visibili solo da zoom >= 2
  const visibleNameplates = useMemo(() => {
    if (!showZoneNameplates) return [];
    const allPlates = (mapNameplatesData as unknown as Record<string, ZoneNameplate[]>)[mapId] || [];
    return allPlates.filter(np => {
      if (availableFloors.length > 1 && np.layer) {
        if (np.layer !== currentFloor.id && np.layer !== currentFloor.layerKey) return false;
      }
      const isMajor = isMajorNameplate(np.icons);
      if (!isMajor && currentZoom < 2) return false;
      return true;
    });
  }, [mapId, currentFloor, availableFloors, showZoneNameplates, currentZoom]);

  // Rendering Zone Nameplates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !nameplateGroupRef.current) return;

    nameplateGroupRef.current.clearLayers();
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    visibleNameplates.forEach(np => {
      if (!np.coordinate || np.coordinate.length < 2) return;
      const latLng = map.unproject([np.coordinate[0], np.coordinate[1]], 3);
      const isMajor = isMajorNameplate(np.icons);

      const iconsHtml = np.icons && np.icons.length > 0
        ? `<div style="display: flex; gap: 3px; align-items: center; justify-content: center; margin-top: 3px;">
            ${np.icons.map(icon => `<img src="${cleanBase}icons/loot-types/${icon}" style="width: 14px; height: 14px; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.9));" alt="" />`).join('')}
           </div>`
        : '';

      const div = L.divIcon({
        className: 'zone-nameplate-div-icon',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; transform: translate(-50%, -50%);">
            <div style="font-size: ${isMajor ? '11px' : '9px'}; font-weight: ${isMajor ? '800' : '600'}; letter-spacing: ${isMajor ? '0.05em' : '0.02em'}; color: ${isMajor ? '#f9fafb' : '#cbd5e1'}; text-shadow: 0 1px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9); white-space: nowrap; text-transform: uppercase;">
              ${escapeHtml(np.title)}
            </div>
            ${iconsHtml}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(latLng, { icon: div, interactive: false });
      nameplateGroupRef.current?.addLayer(marker);
    });
  }, [visibleNameplates]);

  // Rendering Aree di Concentrazione Loot (Poligoni)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !areaGroupRef.current) return;

    areaGroupRef.current.clearLayers();
    if (!showLootAreas) return;

    const allAreas = (mapAreasData as unknown as Record<string, LootArea[]>)[mapId] || [];
    const floorAreas = allAreas.filter(a => {
      if (availableFloors.length <= 1) return true;
      if (!a.layer) return true;
      return a.layer === currentFloor.id || a.layer === currentFloor.layerKey;
    });

    floorAreas.forEach(area => {
      if (!area.vertexes || area.vertexes.length < 3) return;
      const latLngs = area.vertexes.map(v => map.unproject([v[0], v[1]], 3));

      const polygon = L.polygon(latLngs, {
        color: area.color,
        fillColor: area.color,
        weight: 2.5,
        opacity: 0.85,
        fillOpacity: 0.17,
        interactive: false,
      });

      areaGroupRef.current?.addLayer(polygon);
    });
  }, [mapId, currentFloor, availableFloors, showLootAreas]);

  // Rendering POI Markers con Clustering e Viewport Culling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    // Funzione di proiezione a coordinate schermo per il clustering
    const projectToScreen = (coord: [number, number]) => {
      const latLng = map.unproject([coord[0], coord[1]], 3);
      const pt = map.latLngToLayerPoint(latLng);
      return { x: pt.x, y: pt.y };
    };

    // Clustering spaziale sui punti visibili nel viewport culled con raggio adattivo per zoom
    const dynamicPixelRadius = currentZoom <= 0 ? 64 : currentZoom === 1 ? 52 : currentZoom === 2 ? 44 : 36;
    const { priorityPois, singlePois, clusters } = clusterPoisByGrid(culledPois, projectToScreen, dynamicPixelRadius);

    // Funzione helper per disegnare un marker singolo
    const renderSinglePoi = (poi: MapPoi) => {
      const latLng = map.unproject([poi.coordinate[0], poi.coordinate[1]], 3);
      const isQuest = poi.category === 'quest';
      const questInfo = questStepMap.get(poi.id);
      const iconPath = getCategoryIconPath(poi.category);
      const macroGroup = getCategoryMacroGroup(poi.category);
      const groupConfig = MACRO_GROUPS.find(g => g.id === macroGroup);
      const groupColor = groupConfig?.color || '#94a3b8';

      let markerHtml = '';
      if (isQuest) {
        const showStepNumber = Boolean(questInfo && questInfo.isSequential && questInfo.totalSteps > 1);
        markerHtml = `
          <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: rgba(17, 24, 39, 0.95); border: 2px solid #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.6); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <img src="${iconPath || `${cleanBase}icons/map/quest.svg`}" style="width: 16px; height: 16px; object-fit: contain;" alt="Quest" />
            ${showStepNumber ? `<span style="position: absolute; top: -5px; right: -5px; width: 15px; height: 15px; border-radius: 50%; background: #f59e0b; color: #030712; font-size: 9px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.7);">${questInfo?.stepNumber}</span>` : ''}
          </div>
        `;
      } else if (iconPath) {
        markerHtml = `
          <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: rgba(17, 24, 39, 0.92); border: 1.5px solid ${groupColor}; box-shadow: 0 1px 4px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <img src="${iconPath}" style="width: 14px; height: 14px; object-fit: contain;" alt="" />
          </div>
        `;
      } else {
        markerHtml = `
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${groupColor}; border: 1.5px solid rgba(255,255,255,0.85); box-shadow: 0 1px 3px rgba(0,0,0,0.6); cursor: pointer;"></div>
        `;
      }

      const div = L.divIcon({
        className: 'map-poi-custom-div-icon',
        html: markerHtml,
        iconSize: isQuest ? [28, 28] : iconPath ? [24, 24] : [10, 10],
        iconAnchor: isQuest ? [14, 14] : iconPath ? [12, 12] : [5, 5],
        popupAnchor: isQuest ? [0, -14] : iconPath ? [0, -12] : [0, -5],
      });

      const marker = L.marker(latLng, { icon: div });

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

      const questBadgeLabel = questInfo
        ? questInfo.isSequential && questInfo.totalSteps > 1
          ? t('maps.stepOf', { current: questInfo.stepNumber, total: questInfo.totalSteps })
          : questInfo.totalSteps > 1
            ? t('maps.independentObjective')
            : t('maps.questObjective')
        : '';

      const questBadge = questBadgeLabel
        ? `<div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: rgba(245, 158, 11, 0.2); color: #d97706; margin-bottom: 4px;">
             ${questBadgeLabel}
           </div>`
        : '';

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1f2937; min-width: 160px; max-width: 240px;">
          <div style="font-weight: 700; margin-bottom: 4px; font-size: 13px;">${escapeHtml(poi.title)}</div>
          ${questBadge}
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; background: #e5e7eb; margin-bottom: 4px;">
            ${escapeHtml(poi.category.replace(/_/g, ' '))}
          </div>
          ${descSection}
          ${imageSection}
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });
      markerGroupRef.current?.addLayer(marker);
    };

    // 1. Disegna i POI Prioritari (Quest ed Estrazioni) sempre singoli
    priorityPois.forEach(renderSinglePoi);

    // 2. Disegna i POI singoli non clusterizzati
    singlePois.forEach(renderSinglePoi);

    // 3. Disegna i Cluster aggregati
    clusters.forEach(cluster => {
      const latLng = map.unproject([cluster.center[0], cluster.center[1]], 3);
      const isLarge = cluster.count >= 15;
      const ringColor = isLarge ? '#f59e0b' : '#3b82f6';

      const clusterHtml = `
        <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: rgba(15, 23, 42, 0.95); border: 2px solid ${ringColor}; box-shadow: 0 0 10px ${ringColor}66; color: #f8fafc; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s ease;">
          ${cluster.count}
        </div>
      `;

      const div = L.divIcon({
        className: 'map-poi-cluster-icon',
        html: clusterHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const clusterMarker = L.marker(latLng, { icon: div });

      // Click sul cluster: zoom avanti centrato
      clusterMarker.on('click', () => {
        map.setView(latLng, Math.min(map.getZoom() + 1, maxZoom), { animate: true });
      });

      // Popup con riepilogo categorie raggruppate
      const catEntries = Object.entries(cluster.categories).sort((a, b) => b[1] - a[1]);
      const catListHtml = catEntries
        .slice(0, 6)
        .map(([cat, cnt]) => `
          <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 11px; padding: 2px 0;">
            <span style="text-transform: capitalize; color: #4b5563;">${escapeHtml(cat.replace(/_/g, ' '))}</span>
            <span style="font-weight: 700; color: #1f2937;">×${cnt}</span>
          </div>
        `)
        .join('');

      const clusterPopupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1f2937; min-width: 140px; max-width: 200px;">
          <div style="font-weight: 800; margin-bottom: 6px; font-size: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
            ${cluster.count} POI raggruppati
          </div>
          ${catListHtml}
          ${catEntries.length > 6 ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">+ altri ${catEntries.length - 6}...</div>` : ''}
          <div style="font-size: 10px; color: #3b82f6; font-weight: 600; margin-top: 6px; text-align: center;">
            Clicca per ingrandire
          </div>
        </div>
      `;

      clusterMarker.bindPopup(clusterPopupHtml, { maxWidth: 220 });
      markerGroupRef.current?.addLayer(clusterMarker);
    });
  }, [culledPois, questStepMap, maxZoom, currentZoom, t]);

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

  const handleToggleCategory = useCallback((category: string) => {
    setDisabledCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleSetCategoryBatch = useCallback((categories: string[], enable: boolean) => {
    setDisabledCategories(prev => {
      const next = new Set(prev);
      categories.forEach(cat => {
        if (enable) {
          next.delete(cat);
        } else {
          next.add(cat);
        }
      });
      return next;
    });
  }, []);

  const handleToggleQuestTitle = useCallback((title: string) => {
    setDisabledQuestTitles(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  const handleSetQuestBatch = useCallback((titles: string[], enable: boolean) => {
    setDisabledQuestTitles(prev => {
      const next = new Set(prev);
      titles.forEach(t => {
        if (enable) {
          next.delete(t);
        } else {
          next.add(t);
        }
      });
      return next;
    });
  }, []);

  const handleFocusCoordinate = useCallback((coord: [number, number]) => {
    if (!mapInstanceRef.current) return;
    const latLng = mapInstanceRef.current.unproject([coord[0], coord[1]], 3);
    mapInstanceRef.current.setView(latLng, Math.max(mapInstanceRef.current.getZoom(), 2), { animate: true });
    setIsFilterDrawerOpen(false);
  }, []);

  return (
    <div
      className={`relative overflow-hidden border border-gray-800 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-dvh'
          : 'w-full h-[65dvh] min-h-[420px] rounded-[24px] shadow-xl'
      } ${className}`}
      style={{ backgroundColor: '#030712' }}
    >
      {/* Reset background di Leaflet per garantire che il canvas sia SEMPRE scuro (#030712) */}
      <style>{`
        .leaflet-container,
        .leaflet-pane,
        .leaflet-map-pane,
        .leaflet-tile-pane,
        .leaflet-layer,
        .leaflet-tile-container {
          background-color: #030712 !important;
          background: #030712 !important;
        }
        .leaflet-tile {
          image-rendering: auto;
        }
        .map-poi-custom-div-icon, .zone-nameplate-div-icon, .map-poi-cluster-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      {/* Contenitore Leaflet */}
      <div
        ref={containerRef}
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing"
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
          {t('maps.poisCount', { count: filteredPois.length })}
        </div>
      </div>

      {/* Pulsante Filtri Flottante in basso a sinistra */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800 backdrop-blur-md border border-gray-800 text-gray-200 hover:text-white transition-all shadow-xl active:scale-95 cursor-pointer"
        >
          <Filter size={16} className="text-blue-400" />
          <span className="text-xs font-bold">{t('maps.filterButton')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">
            {filteredPois.length}
          </span>
        </button>
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

      {/* Drawer Filtri POI */}
      <MapPoiFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        allFloorPois={floorPois}
        disabledCategories={disabledCategories}
        onToggleCategory={handleToggleCategory}
        onSetCategoryBatch={handleSetCategoryBatch}
        showZoneNameplates={showZoneNameplates}
        onToggleZoneNameplates={() => setShowZoneNameplates(prev => !prev)}
        showLootAreas={showLootAreas}
        onToggleLootAreas={() => setShowLootAreas(prev => !prev)}
        disabledQuestTitles={disabledQuestTitles}
        onToggleQuestTitle={handleToggleQuestTitle}
        onSetQuestBatch={handleSetQuestBatch}
        onFocusCoordinate={handleFocusCoordinate}
      />
    </div>
  );
};
