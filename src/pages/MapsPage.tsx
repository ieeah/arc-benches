import { useState } from 'react';
import { ArrowLeft, Layers, Compass } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { SectionHeader } from '@/components/SectionHeader';
import { IconButton } from '@/components/IconButton';
import { MapViewer } from '@/components/MapViewer';
import { ScrollableFadeContainer } from '@/components/ScrollableFadeContainer';
import { GAME_MAPS } from '@/lib/maps';
import { useTranslation } from '@/i18n';

type MapsPageProps = {
  onBack?: () => void;
};

const MAP_LIST = GAME_MAPS;

export const MapsPage = ({ onBack }: MapsPageProps) => {
  const { t } = useTranslation();
  const [selectedMapId, setSelectedMapId] = useState<string>('buried-city');

  const currentMap = MAP_LIST.find(m => m.id === selectedMapId) ?? MAP_LIST[0];

  return (
    <PageLayout
      headerSlot={
        <div className="space-y-3">
          <SectionHeader
            title={t('maps.title')}
            leading={
              onBack ? (
                <IconButton onClick={onBack} title={t('common.back')}>
                  <ArrowLeft size={16} />
                </IconButton>
              ) : undefined
            }
            actions={
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <Compass size={14} />
                <span>v1.x Preview</span>
              </div>
            }
          />

          {/* Selettore Orizzontale delle Mappe (Pill a scorrimento con affordance visiva) */}
          <ScrollableFadeContainer
            bleedType="none"
            containerClassName="gap-2 py-1"
            ariaLabel={t('maps.title')}
          >
            {MAP_LIST.map(map => {
              const isSelected = map.id === selectedMapId;
              return (
                <button
                  key={map.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedMapId(map.id)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
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
          </ScrollableFadeContainer>
        </div>
      }
    >
      {/* Visualizzatore Mappa */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {currentMap.name}{currentMap.badge ? ` (${currentMap.badge})` : ""}
          </span>
          <span>{t('maps.gestureHint')}</span>
        </div>

        <MapViewer mapId={selectedMapId} minZoom={8} maxZoom={12} />
      </section>
    </PageLayout>
  );
};
