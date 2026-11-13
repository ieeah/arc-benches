import { Radar } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { triggerNavHaptic } from './quickFavoritesNav';

export type RaidNavRadarButtonProps = {
  hasRaidElements: boolean;
  isRaidRunning: boolean;
  onNavigate: (pageId: string) => void;
  onAction?: () => void;
  className?: string;
};

export const RaidNavRadarButton = ({
  hasRaidElements,
  isRaidRunning,
  onNavigate,
  onAction,
  className = '',
}: RaidNavRadarButtonProps) => {
  const { t } = useTranslation();

  if (!hasRaidElements) {
    return null;
  }

  const handleClick = () => {
    onNavigate('raid');
    onAction?.();
    triggerNavHaptic(20);
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`.trim()}>
      {/* Bagliori Magici AI a 4 Colori Arc Raiders (solo quando raid in corso) */}
      {isRaidRunning && (
        <>
          <span className="arc-magic-glow-blur" />
          <span className="arc-magic-glow" />
        </>
      )}
      <button
        onClick={handleClick}
        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer select-none ${
          isRaidRunning
            ? 'bg-gray-950 text-white shadow-inner'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label={t('nav.raidPlan')}
        title={t('nav.raidPlan')}
      >
        <Radar
          size={21}
          className={
            isRaidRunning
              ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] stroke-[2.3]'
              : ''
          }
        />
      </button>
    </div>
  );
};
