import { useState } from 'react';
import { Map, ArrowLeft, Layers, Compass } from 'lucide-react';
import { MapViewer } from '@/components/MapViewer';

interface MapsPageProps {
  onBack?: () => void;
}

const MAP_LIST = [
  { id: 'buried-city', name: 'Buried City', badge: 'Wasteland' },
  { id: 'dam-battlegrounds', name: 'Dam Battlegrounds', badge: 'Swamp & Dam' },
  { id: 'spaceport', name: 'The Spaceport', badge: 'Acerra' },
  { id: 'the-blue-gate', name: 'The Blue Gate', badge: 'Valley' },
  { id: 'stella-montis', name: 'Stella Montis', badge: 'Mountain Lab' },
  { id: 'riven-tides', name: 'Riven Tides', badge: 'Coastal Harbor' },
];

export const MapsPage = ({ onBack }: MapsPageProps) => {
  const [selectedMapId, setSelectedMapId] = useState<string>('buried-city');

  const currentMap = MAP_LIST.find(m => m.id === selectedMapId) ?? MAP_LIST[0];

  return (
    <div className="flex flex-col gap-4 pb-28 pt-4 px-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
              aria-label="Indietro"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Map size={22} className="text-blue-500" />
              Mappe Tattiche
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visualizzatore offline ad alta risoluzione
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Compass size={14} />
          <span>v1.x Preview</span>
        </div>
      </header>

      {/* Selettore Orizzontale delle Mappe (Pill a scorrimento) */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {MAP_LIST.map(map => {
          const isSelected = map.id === selectedMapId;
          return (
            <button
              key={map.id}
              onClick={() => setSelectedMapId(map.id)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <Layers size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
              <span>{map.name}</span>
            </button>
          );
        })}
      </div>

      {/* Visualizzatore Mappa */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {currentMap.name} ({currentMap.badge})
          </span>
          <span>Zoom e pan con tocco o rotellina</span>
        </div>

        <MapViewer mapId={selectedMapId} minZoom={8} maxZoom={12} />
      </section>
    </div>
  );
};
