import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { iconUrl } from '@/lib/icons';

export type CollectionHubCardProps = {
  title: string;
  description: string;
  ownedCount: number;
  totalCount: number;
  percentage: number;
  onClick: () => void;
  collectionKey?: 'blueprints' | 'designs' | 'stencils';
  accentGradient?: string;
};

const DESIGN_GRID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11 0h2v8h-2zM11 16h2v8h-2zM0 11h8v2H0zM16 11h8v2h-8z" fill="rgb(133 149 177 / 0.18)"/><path d="M11 8h2v3h3v2h-3v3h-2v-3H8v-2h3z" fill="rgb(133 149 177 / 0.58)"/></svg>`;
const DESIGN_GRID_URI = `url("data:image/svg+xml,${encodeURIComponent(DESIGN_GRID_SVG)}")`;

const STENCIL_PATTERN = `repeating-linear-gradient(45deg, rgba(236, 72, 153, 0.12) 0, rgba(236, 72, 153, 0.12) 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, rgba(168, 85, 247, 0.12) 0, rgba(168, 85, 247, 0.12) 2px, transparent 2px, transparent 10px), radial-gradient(circle at 100% 0%, rgba(236, 72, 153, 0.35) 0%, transparent 75%), #1d152b`;

function getTopSectionBackground(key?: 'blueprints' | 'designs' | 'stencils'): string {
  switch (key) {
    case 'blueprints':
      return `linear-gradient(135deg, rgba(10, 15, 30, 0.45) 0%, rgba(10, 15, 30, 0.75) 100%), url("${iconUrl('blueprint-bg.jpg')}") center / cover no-repeat, #0a0f1e`;
    case 'designs':
      return `radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.35) 0%, transparent 75%), ${DESIGN_GRID_URI} center / 24px 24px repeat, #182336`;
    case 'stencils':
      return STENCIL_PATTERN;
    default:
      return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
  }
}

export const CollectionHubCard: React.FC<CollectionHubCardProps> = ({
  title,
  description,
  ownedCount,
  totalCount,
  percentage,
  onClick,
  collectionKey = 'blueprints',
  accentGradient = 'from-blue-500 to-indigo-500',
}) => {
  const { t } = useTranslation();
  const isComplete = ownedCount === totalCount && totalCount > 0;
  const topBg = getTopSectionBackground(collectionKey);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex flex-col rounded-[24px] sm:rounded-[28px] border-2 border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#0c1017] hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer select-none active:scale-[0.99] group shadow-xs overflow-clip"
    >
      {/* ── TOP SECTION (Pattern + Overlay + Titolo + Progressbar + Statistiche) ── */}
      <div
        style={{ background: topBg }}
        className="relative px-5 py-5 sm:px-6 sm:py-6 overflow-hidden border-b border-black/10 dark:border-white/10"
      >
        {/* Overlay a gradiente scuro ad alte prestazioni per massimo contrasto del testo e della barra */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/80 to-gray-950/92 backdrop-blur-[0.5px] pointer-events-none"
        />

        <div className="relative z-1 space-y-3.5">
          {/* Header riga: Nome e % completamento */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-tight drop-shadow-sm group-hover:text-blue-400 dark:group-hover:text-blue-300 transition-colors">
              {title}
            </h3>

            <span
              className={`shrink-0 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold font-mono border backdrop-blur-xs ${
                isComplete
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/40 shadow-xs'
                  : 'bg-white/10 text-white/95 border-white/20'
              }`}
            >
              {percentage}%
            </span>
          </div>

          {/* Progress bar a larghezza piena (w-full) */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 sm:h-3 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${accentGradient} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Sotto la barra: N/tot a sinistra e N mancanti a destra */}
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-medium text-gray-300">
              <span className="font-semibold text-gray-200">
                <strong className="text-white font-mono font-bold text-xs sm:text-sm">{ownedCount}</strong> / {totalCount}
              </span>

              <span>
                {isComplete ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> {t('common.done')}!
                  </span>
                ) : (
                  <span className="text-gray-300/90 font-medium">
                    <strong className="font-mono font-bold text-white">{totalCount - ownedCount}</strong> {t('stash.filterMissing').toLowerCase()}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION (Descrizione ad alto contrasto su sfondo scuro) ── */}
      <div className="px-5 py-4 sm:px-6 sm:py-4.5 flex items-center justify-between gap-4 bg-white dark:bg-[#0c1017]">
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-normal">
          {description}
        </p>

        <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
