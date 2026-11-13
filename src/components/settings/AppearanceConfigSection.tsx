import {
  ArrowUpDown, Check, Hammer, LayoutGrid, Languages, Moon, Sparkles, Sun
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAppStore } from '@/store';
import { useTranslation, type AppLanguage } from '@/i18n';

type AppearanceConfigSectionProps = {
  onFeedback?: (msg: string) => void;
};

export const AppearanceConfigSection = ({ onFeedback }: AppearanceConfigSectionProps) => {
  const { dark: isDark, toggle: toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useTranslation();

  const stashGridDensity = useAppStore(s => s.stashGridDensity);
  const setStashGridDensity = useAppStore(s => s.setStashGridDensity);
  const stashPriorityMode = useAppStore(s => s.stashPriorityMode);
  const setStashPriorityMode = useAppStore(s => s.setStashPriorityMode);
  const craftMode = useAppStore(s => s.craftMode);
  const setCraftMode = useAppStore(s => s.setCraftMode);

  const handleLanguageChange = (langCode: AppLanguage) => {
    setLanguage(langCode);
    const selected = languages.find(l => l.code === langCode);
    onFeedback?.(t('settings.feedbackLanguage', { lang: `${selected?.label} ${selected?.flag}` }));
  };

  const handleStashGridDensityChange = (density: 'comfortable' | 'compact') => {
    setStashGridDensity(density);
    onFeedback?.(t('settings.feedbackDensity', {
      density: density === 'comfortable'
        ? `${t('settings.comfortable')} (${t('settings.comfortableDesc')})`
        : `${t('settings.compact')} (${t('settings.compactDesc')})`
    }));
  };

  const handleStashPriorityModeChange = (mode: 'list-first' | 'level-first') => {
    setStashPriorityMode(mode);
    onFeedback?.(t('settings.feedbackStashPriorityMode', {
      mode: mode === 'list-first' ? t('settings.stashPriorityListFirst') : t('settings.stashPriorityLevelFirst'),
    }));
  };

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-4">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Sparkles size={14} className="text-blue-500" /> {t('settings.appearance')}
      </h2>

      {/* Lingua */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('settings.language')}</p>
            <p className="text-xs text-gray-500">{t('settings.languageDesc')}</p>
          </div>
          <Languages size={18} className="text-gray-400" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => handleLanguageChange(l.code)}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                language === l.code
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {language === l.code && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Tema */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('settings.theme')}</p>
          <p className="text-xs text-gray-500">{t('settings.themeDesc')}</p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          {isDark ? <Moon size={15} className="text-blue-400" /> : <Sun size={15} className="text-amber-500" />}
          <span>{isDark ? t('settings.themeDark') : t('settings.themeLight')}</span>
        </button>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Densità Griglia Stash */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('settings.stashDensity')}</p>
            <p className="text-xs text-gray-500">{t('settings.stashDensityDesc')}</p>
          </div>
          <LayoutGrid size={18} className="text-gray-400" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleStashGridDensityChange('comfortable')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              stashGridDensity === 'comfortable'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{t('settings.comfortable')}</span>
              {stashGridDensity === 'comfortable' && <Check size={14} />}
            </div>
            <span className={`text-[10px] font-normal ${stashGridDensity === 'comfortable' ? 'text-blue-100' : 'text-gray-400'}`}>{t('settings.comfortableDesc')}</span>
          </button>
          <button
            onClick={() => handleStashGridDensityChange('compact')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              stashGridDensity === 'compact'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{t('settings.compact')}</span>
              {stashGridDensity === 'compact' && <Check size={14} />}
            </div>
            <span className={`text-[10px] font-normal ${stashGridDensity === 'compact' ? 'text-blue-100' : 'text-gray-400'}`}>{t('settings.compactDesc')}</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Criterio Priorità Stash */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('settings.stashPriorityMode')}</p>
            <p className="text-xs text-gray-500">{t('settings.stashPriorityModeDesc')}</p>
          </div>
          <ArrowUpDown size={18} className="text-gray-400 shrink-0" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleStashPriorityModeChange('list-first')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              stashPriorityMode === 'list-first'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{t('settings.stashPriorityListFirst')}</span>
              {stashPriorityMode === 'list-first' && <Check size={14} />}
            </div>
            <span className={`text-[10px] font-normal ${stashPriorityMode === 'list-first' ? 'text-blue-100' : 'text-gray-400'}`}>
              {t('settings.stashPriorityListFirstDesc')}
            </span>
          </button>
          <button
            onClick={() => handleStashPriorityModeChange('level-first')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              stashPriorityMode === 'level-first'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{t('settings.stashPriorityLevelFirst')}</span>
              {stashPriorityMode === 'level-first' && <Check size={14} />}
            </div>
            <span className={`text-[10px] font-normal ${stashPriorityMode === 'level-first' ? 'text-blue-100' : 'text-gray-400'}`}>
              {t('settings.stashPriorityLevelFirstDesc')}
            </span>
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Modalità Verifica Crafting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('settings.craftMode')}</p>
            <p className="text-xs text-gray-500">{t('settings.craftModeDesc')}</p>
          </div>
          <Hammer size={18} className="text-gray-400 shrink-0" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setCraftMode('level-only')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              craftMode === 'level-only'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{t('settings.craftModeLevelOnly')}</span>
              {craftMode === 'level-only' && <Check size={14} />}
            </div>
            <span className={`text-[10px] font-normal ${craftMode === 'level-only' ? 'text-blue-100' : 'text-gray-400'}`}>
              {t('settings.craftModeLevelOnlyDesc')}
            </span>
          </button>
          <button
            onClick={() => setCraftMode('strict')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              craftMode === 'strict'
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{t('settings.craftModeStrict')}</span>
              {craftMode === 'strict' && <Check size={14} />}
            </div>
            <span className={`text-[10px] font-normal ${craftMode === 'strict' ? 'text-blue-100' : 'text-gray-400'}`}>
              {t('settings.craftModeStrictDesc')}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
