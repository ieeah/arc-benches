import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';

type ProfilesManagerSectionProps = {
  onFeedback?: (msg: string) => void;
};

export const ProfilesManagerSection = ({ onFeedback }: ProfilesManagerSectionProps) => {
  const { t } = useTranslation();
  const store = useAppStore();

  const mainProfileId = useAppStore(s => s.mainProfileId);
  const setMainProfileId = useAppStore(s => s.setMainProfileId);
  const startupProfileOption = useAppStore(s => s.startupProfileOption);
  const setStartupProfileOption = useAppStore(s => s.setStartupProfileOption);

  const [newProfileName, setNewProfileName] = useState('');
  const [showNewProfileInput, setShowNewProfileInput] = useState(false);

  const handleMainProfileChange = (id: string) => {
    setMainProfileId(id);
    onFeedback?.(t('settings.feedbackMainProfile'));
  };

  const handleStartupProfileChange = (option: string) => {
    setStartupProfileOption(option);
    onFeedback?.(t('settings.feedbackStartupProfile'));
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    store.createProfile(newProfileName.trim());
    setNewProfileName('');
    setShowNewProfileInput(false);
    onFeedback?.(t('settings.feedbackProfileCreated'));
  };

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Users size={14} className="text-purple-500" /> {t('settings.profilesHeader', { count: store.profiles.length })}
        </h2>
        {!showNewProfileInput && (
          <button
            onClick={() => setShowNewProfileInput(true)}
            className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> {t('settings.newProfile')}
          </button>
        )}
      </div>

      {/* Profilo Principale vs Profilo all'Apertura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/40">
        <div>
          <label className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block mb-1">
            {t('settings.mainProfileLabel')}
          </label>
          <select
            value={mainProfileId}
            onChange={e => handleMainProfileChange(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-200"
          >
            {store.profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.id === store.activeProfileId ? t('settings.inUse') : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block mb-1">
            {t('settings.startupProfileLabel')}
          </label>
          <select
            value={startupProfileOption}
            onChange={e => handleStartupProfileChange(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-200"
          >
            <option value="last-used">{t('settings.startupLastUsed')}</option>
            <option value="main">{t('settings.startupAlwaysMain')}</option>
            {store.profiles.map(p => (
              <option key={p.id} value={p.id}>
                {t('settings.startupFixed', { name: p.name })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showNewProfileInput && (
        <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-800/70 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in">
          <input
            type="text"
            placeholder={t('settings.profileNamePlaceholder')}
            value={newProfileName}
            onChange={e => setNewProfileName(e.target.value)}
            className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={handleCreateProfile}
            className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {t('settings.createProfile')}
          </button>
          <button
            onClick={() => setShowNewProfileInput(false)}
            className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all cursor-pointer"
          >
            {t('settings.cancelProfile')}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {store.profiles.map(p => {
          const isActive = p.id === store.activeProfileId;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/80 shadow-sm'
                  : 'bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{p.name}</span>
                  {isActive && (
                    <span className="text-[10px] bg-purple-500 text-white font-bold px-2 py-0.2 rounded-full">
                      {t('settings.active')}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-mono">ID: {p.id}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {!isActive && (
                  <>
                    <button
                      onClick={() => store.switchProfile(p.id)}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-gray-800 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 shadow-sm hover:bg-purple-50 cursor-pointer"
                    >
                      {t('settings.activate')}
                    </button>
                    {store.profiles.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(t('settings.deleteProfileConfirm', { name: p.name }))) {
                            store.deleteProfile(p.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-500 cursor-pointer"
                        title={t('settings.deleteProfileTitle')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
