import { Info } from 'lucide-react';
import { useTranslation } from '@/i18n';

export const AppInfoSection = () => {
  const { t } = useTranslation();

  return (
    <section className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-[24px] text-center space-y-1">
      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1.5">
        <Info size={14} className="text-blue-500" /> {t('settings.appInfo')}
      </p>
      <p className="text-[11px] text-gray-500">
        {t('settings.versionInfo', { version: __APP_VERSION__ })}
      </p>
    </section>
  );
};
