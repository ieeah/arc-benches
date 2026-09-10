import { useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { buildNavTree, getEffectiveNavConfig, type NavItem } from '@/lib/navTree';

const isDev = import.meta.env.DEV;

/** The navigation tree resolved from `nav.json` (+ dev draft in DEV), localized for the active language. */
export function useNavTree(): NavItem[] {
  const { t, language } = useTranslation();
  return useMemo(
    () => buildNavTree(getEffectiveNavConfig(), { isDev, t }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, language],
  );
}
