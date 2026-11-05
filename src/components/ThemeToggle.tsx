import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { IconButton } from '@/components/IconButton';
import { useTranslation } from '@/i18n';

export const ThemeToggle = () => {
  const { dark, toggle } = useTheme();
  const { t } = useTranslation();
  return (
    <IconButton onClick={toggle} title={t('settings.themeToggleTooltip')}>
      {dark ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-gray-500" />}
    </IconButton>
  );
};
