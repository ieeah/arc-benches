import { useState, useEffect } from 'react';
import {
  getSeedNavConfig, readNavDraft, writeNavDraft, clearNavDraft,
  type NavConfig,
} from '@/lib/navTree';

/**
 * Draft state for the dev nav editor. Mirrors `useDevListDrafts`: the working copy
 * lives in localStorage and overrides `nav.json` at runtime (DEV only). Reset drops
 * back to the bundled seed.
 */
export function useDevNavDraft() {
  const seed = getSeedNavConfig();

  const [config, setConfigState] = useState<NavConfig>(() => readNavDraft() ?? seed);

  const seedJson = JSON.stringify(seed);

  useEffect(() => {
    // Don't persist a draft that just mirrors the bundled seed.
    if (JSON.stringify(config) === seedJson) clearNavDraft();
    else writeNavDraft(config);
  }, [config, seedJson]);

  const setConfig = (next: NavConfig) => setConfigState(next);

  const resetDraft = () => {
    clearNavDraft();
    setConfigState(seed);
  };

  const isDirty = JSON.stringify(config) !== JSON.stringify(seed);

  return { config, setConfig, resetDraft, seed, isDirty };
}
