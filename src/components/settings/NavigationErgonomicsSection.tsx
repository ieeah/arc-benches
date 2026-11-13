import { useMemo } from 'react';
import { Check, Hand, Sparkles, Zap, ZapOff } from 'lucide-react';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';
import { useNavTree } from '@/hooks/useNavTree';
import { flattenNavLeaves } from '@/lib/navTree';

/** Nav ids that are not sensible quick-favorite targets (dead entry / modal). */
const NON_FAVORITE_IDS = new Set(['vault', 'role-maker']);

type NavigationErgonomicsSectionProps = {
  onFeedback?: (msg: string) => void;
};

export const NavigationErgonomicsSection = ({ onFeedback }: NavigationErgonomicsSectionProps) => {
  const { t } = useTranslation();

  const navSide = useAppStore(s => s.navSide);
  const setNavSide = useAppStore(s => s.setNavSide);
  const navVariant = useAppStore(s => s.navVariant);
  const setNavVariant = useAppStore(s => s.setNavVariant);
  const reducedMotion = useAppStore(s => s.reducedMotion) ?? 'auto';
  const setReducedMotion = useAppStore(s => s.setReducedMotion);
  const quickFavorites = useAppStore(s => s.quickFavorites) ?? ['stash', 'liste'];
  const setQuickFavorites = useAppStore(s => s.setQuickFavorites);

  // Quick-favorite targets: navigable leaves of the nav tree (categories flattened out,
  // non-page entries like the role-maker modal excluded).
  const navTree = useNavTree();
  const AVAILABLE_PAGES: { id: string; label: string }[] = useMemo(
    () =>
      flattenNavLeaves(navTree)
        .filter(item => !item.devOnly && !NON_FAVORITE_IDS.has(item.id))
        .map(item => ({ id: item.id, label: item.label })),
    [navTree],
  );

  const handleFavoriteChange = (index: 0 | 1, value: string) => {
    const updated: [string, string] = [...quickFavorites] as [string, string];
    updated[index] = value;
    setQuickFavorites(updated);
    onFeedback?.(t('settings.feedbackQuickFavorite', {
      index: index + 1,
      page: AVAILABLE_PAGES.find((p: { id: string; label: string }) => p.id === value)?.label ?? value,
    }));
  };

  const handleNavSideChange = (side: 'left' | 'right') => {
    setNavSide(side);
    onFeedback?.(t('settings.feedbackNavSide', {
      side: side === 'right' ? t('settings.navRight') : t('settings.navLeft'),
    }));
  };

  const handleNavVariantChange = (variant: 'classic' | 'morphing') => {
    setNavVariant(variant);
    onFeedback?.(variant === 'morphing' ? t('settings.feedbackNavStyleMorphing') : t('settings.feedbackNavStyleClassic'));
  };

  const handleReducedMotionChange = (mode: 'auto' | 'reduce' | 'normal') => {
    setReducedMotion(mode);
    const labels = {
      auto: t('settings.feedbackMotionAuto'),
      reduce: t('settings.feedbackMotionReduced'),
      normal: t('settings.feedbackMotionActive'),
    };
    onFeedback?.(labels[mode]);
  };

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-4">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Hand size={14} className="text-blue-500" /> {t('settings.ergonomics')}
      </h2>

      {/* Navigazione Rapida: Pagine Preferite per il Tap Singolo */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('settings.quickFavorites')}</p>
          <p className="text-xs text-gray-500">
            {t('settings.quickFavoritesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('settings.page1')}</label>
            <select
              value={quickFavorites[0]}
              onChange={(e) => handleFavoriteChange(0, e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_PAGES.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('settings.page2')}</label>
            <select
              value={quickFavorites[1]}
              onChange={(e) => handleFavoriteChange(1, e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_PAGES.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Lato Navigazione */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('settings.navPosition')}</p>
            <p className="text-xs text-gray-500">{t('settings.navPositionDesc')}</p>
          </div>
          <Hand size={18} className="text-gray-400" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleNavSideChange('left')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              navSide === 'left'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('settings.navLeft')} {navSide === 'left' && <Check size={14} />}
          </button>
          <button
            onClick={() => handleNavSideChange('right')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              navSide === 'right'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('settings.navRight')} {navSide === 'right' && <Check size={14} />}
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Stile Barra di Navigazione (Classico vs Morphing a Molla) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              {t('settings.navStyleTitle')}
              <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-full">
                Demo
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {t('settings.navStyleDesc')}
            </p>
          </div>
          <Sparkles size={18} className="text-purple-500" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleNavVariantChange('classic')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              navVariant === 'classic'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('settings.navStyleClassic')} {navVariant === 'classic' && <Check size={14} />}
          </button>
          <button
            onClick={() => handleNavVariantChange('morphing')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              navVariant === 'morphing'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('settings.navStyleMorphing')} {navVariant === 'morphing' && <Check size={14} />}
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Effetti e Animazioni (Movimento Ridotto) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {t('settings.motionTitle')}
            </p>
            <p className="text-xs text-gray-500">
              {t('settings.motionDesc')}
            </p>
          </div>
          {reducedMotion === 'reduce' ? <ZapOff size={18} className="text-amber-500" /> : <Zap size={18} className="text-blue-500" />}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => handleReducedMotionChange('auto')}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              reducedMotion === 'auto'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{t('settings.motionSystem')}</span>
            <span className="text-[10px] opacity-75 font-normal">{t('settings.motionSystemHint')}</span>
          </button>
          <button
            onClick={() => handleReducedMotionChange('reduce')}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              reducedMotion === 'reduce'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{t('settings.motionReduced')}</span>
            <span className="text-[10px] opacity-75 font-normal">{t('settings.motionReducedHint')}</span>
          </button>
          <button
            onClick={() => handleReducedMotionChange('normal')}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              reducedMotion === 'normal'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{t('settings.motionActive')}</span>
            <span className="text-[10px] opacity-75 font-normal">{t('settings.motionActiveHint')}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
