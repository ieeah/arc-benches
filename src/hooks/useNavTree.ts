import { useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { buildNavTree, getEffectiveNavConfig, type NavItem } from '@/lib/navTree';
import { useFeatureFlags } from '@/lib/featureFlags';

const isDev = import.meta.env.DEV;

/** The navigation tree resolved from `nav.json` (+ dev draft in DEV), localized for the active language and filtered by feature flags. */
export function useNavTree(): NavItem[] {
  const { t, language } = useTranslation();
  const { flags } = useFeatureFlags();

  return useMemo(
    () => buildNavTree(getEffectiveNavConfig(), { isDev, t }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, language, flags],
  );
}

