import { useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { buildNavTree, getEffectiveNavConfig, type NavItem } from '@/lib/navTree';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useAppStore } from '@/store';
import { isNavIdActive } from '@/lib/sections';

const isDev = import.meta.env.DEV;

/** The navigation tree resolved from `nav.json` (+ dev draft in DEV), localized for the active language and filtered by feature flags and user enabledSections. */
export function useNavTree(): NavItem[] {
  const { t, language } = useTranslation();
  const { flags } = useFeatureFlags();
  const enabledSections = useAppStore(s => s.enabledSections);

  return useMemo(
    () => buildNavTree(getEffectiveNavConfig(), {
      isDev,
      t,
      isNavIdEnabled: (id) => isNavIdActive(id, { enabledSections }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, language, flags, enabledSections],
  );
}

