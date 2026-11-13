import { Download, Upload } from 'lucide-react';
import { useAppStore } from '@/store';
import { downloadExport } from '@/lib/listIO';
import { useTranslation } from '@/i18n';

export const BackupPortabilitySection = () => {
  const { t } = useTranslation();
  const store = useAppStore();

  const handleExport = () => {
    const { sharedLists, profiles: exported } = store.buildExportData(store.profiles.map(p => p.id));
    downloadExport({ version: 3, exportedAt: new Date().toISOString(), sharedLists, profiles: exported });
  };

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-4">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Download size={14} className="text-emerald-500" /> {t('settings.backupPortability')}
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleExport}
          className="p-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Upload size={18} className="text-blue-500" />
          <span>{t('settings.exportJson')}</span>
        </button>
        <button
          onClick={() => alert(t('settings.importPrompt'))}
          className="p-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download size={18} className="text-emerald-500" />
          <span>{t('settings.importJson')}</span>
        </button>
      </div>
    </section>
  );
};
