import defaultWorkbenchesData from '@/data/workbenches.json';
import defaultExpeditionsData from '@/data/expeditions.json';
import itemsOverridesData from '@/data/items-overrides.json';
import { it as defaultIt } from '@/i18n/locales/it';
import { en as defaultEn } from '@/i18n/locales/en';

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullPath));
    } else if (typeof value === 'string') {
      result[fullPath] = value;
    }
  }
  return result;
}

/**
 * Checks whether any developer draft in localStorage contains modifications
 * compared to the bundled source files. Used for live-testing and beforeunload warnings.
 */
export function hasUnsavedDevChanges(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    // 1. Check Lists Draft
    const listsDraft = localStorage.getItem('arc_benches_dev_lists_draft_v1');
    if (listsDraft) {
      const parsed = JSON.parse(listsDraft);
      const initialWb = JSON.stringify(defaultWorkbenchesData.items || []);
      const initialExp = JSON.stringify((defaultExpeditionsData as any).lists || (defaultExpeditionsData as any).items || []);
      if (parsed.workbench && JSON.stringify(parsed.workbench) !== initialWb) return true;
      if (parsed.expedition && JSON.stringify(parsed.expedition) !== initialExp) return true;
      if (parsed.project && Array.isArray(parsed.project) && parsed.project.length > 0) return true;
      if (parsed.quest && Array.isArray(parsed.quest) && parsed.quest.length > 0) return true;
    }

    // 2. Check Overrides Draft
    const overridesDraft = localStorage.getItem('dev_items_overrides_draft');
    if (overridesDraft) {
      const p1 = JSON.parse(overridesDraft);
      if (JSON.stringify(p1) !== JSON.stringify(itemsOverridesData)) return true;
    }

    // 3. Check Translations Draft
    const itDraft = localStorage.getItem('dev_i18n_it_draft');
    if (itDraft) {
      const pIt = JSON.parse(itDraft);
      const defaultFlatIt = flattenObject(defaultIt);
      if (JSON.stringify(pIt) !== JSON.stringify(defaultFlatIt)) return true;
    }

    const enDraft = localStorage.getItem('dev_i18n_en_draft');
    if (enDraft) {
      const pEn = JSON.parse(enDraft);
      const defaultFlatEn = flattenObject(defaultEn);
      if (JSON.stringify(pEn) !== JSON.stringify(defaultFlatEn)) return true;
    }
  } catch {
    // ignore
  }
  return false;
}
