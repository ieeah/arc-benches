import { useCallback } from 'react';
import type { ItemInfo, List, CheckboxAction, Reward, ActionTranslation } from '@/types';
import { fuzzyMatch } from '@/lib/fuzzy';
import { useAppStore } from '@/store';
import { it } from './locales/it';
import { en } from './locales/en';
import { SUPPORTED_LANGUAGES, type AppLanguage } from './types';

export * from './types';

function computeEffectiveLocales(): Record<string, typeof it> {
  const result: Record<string, any> = {
    it: JSON.parse(JSON.stringify(it)),
    en: JSON.parse(JSON.stringify(en)),
  };

  if (import.meta.env.DEV) {
    try {
      const itDraft = localStorage.getItem('dev_i18n_it_draft');
      if (itDraft) {
        const flat = JSON.parse(itDraft);
        for (const [path, val] of Object.entries(flat)) {
          const parts = path.split('.');
          let cur: any = result.it;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = val;
        }
      }

      const enDraft = localStorage.getItem('dev_i18n_en_draft');
      if (enDraft) {
        const flat = JSON.parse(enDraft);
        for (const [path, val] of Object.entries(flat)) {
          const parts = path.split('.');
          let cur: any = result.en;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = val;
        }
      }
    } catch {
      // ignore
    }
  }

  return result;
}

const LOCALES: Record<string, typeof it> = computeEffectiveLocales();

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationPath = NestedKeyOf<typeof it>;

export function translate(
  lang: AppLanguage = 'en',
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = LOCALES[lang] || LOCALES.en || LOCALES.it;
  const parts = path.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English, then Italian
      let fallbackCurrent: any = LOCALES.en || LOCALES.it;
      for (const fPart of parts) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && fPart in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[fPart];
        } else {
          fallbackCurrent = undefined;
          break;
        }
      }
      current = fallbackCurrent !== undefined ? fallbackCurrent : path;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  if (!params) return current;

  return current.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

export function useTranslation() {
  const language = useAppStore(s => s.language ?? 'en');
  const setLanguage = useAppStore(s => s.setLanguage);

  const t = useCallback(
    (path: TranslationPath | string, params?: Record<string, string | number>) => {
      return translate(language, path, params);
    },
    [language]
  );

  return {
    t,
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}

/**
 * Returns localized item name with intelligent fallback to default (EN) name.
 */
export function getItemName(item?: ItemInfo | null, lang: AppLanguage = 'en'): string {
  if (!item) return '';
  if (lang !== 'en' && item.translations?.[lang]?.name) {
    return item.translations[lang].name!;
  }
  return item.name;
}

/**
 * Returns localized item description with intelligent fallback to default (EN) description.
 */
export function getItemDescription(item?: ItemInfo | null, lang: AppLanguage = 'en'): string {
  if (!item) return '';
  if (lang !== 'en' && item.translations?.[lang]?.description) {
    return item.translations[lang].description!;
  }
  return item.description ?? '';
}

/**
 * Returns localized workbench name.
 */
export function getWorkbenchName(workbench?: List | null, lang: AppLanguage = 'en'): string {
  if (!workbench) return '';
  if (lang !== 'en' && workbench.translations?.[lang]?.name) {
    return workbench.translations[lang].name!;
  }
  return workbench.name;
}

/**
 * Returns localized list / workbench name.
 */
export function getListName(list?: List | null, lang: AppLanguage = 'en'): string {
  if (!list) return '';
  if (lang !== 'en' && list.translations?.[lang]?.name) {
    return list.translations[lang].name!;
  }
  return list.name;
}

/**
 * Returns localized list description.
 */
export function getListDescription(list?: List | null, lang: AppLanguage = 'en'): string {
  if (!list) return '';
  if (lang !== 'en' && list.translations?.[lang]?.description) {
    return list.translations[lang].description!;
  }
  return list.description ?? '';
}

/**
 * Returns localized action label with fallback to default label.
 */
export function getActionLabel(
  action?: { label: string; translations?: Record<string, ActionTranslation> } | CheckboxAction | null,
  lang: AppLanguage = 'en',
): string {
  if (!action) return '';
  const translated = action.translations?.[lang]?.label?.trim();
  if (lang !== 'en' && translated) {
    return translated;
  }
  return action.label;
}

/**
 * Returns localized reward label with fallback to default label.
 */
export function getRewardLabel(reward?: Reward | null, lang: AppLanguage = 'en'): string {
  if (!reward) return '';
  if (lang !== 'en' && reward.translations?.[lang]?.label) {
    return reward.translations[lang].label!;
  }
  return reward.label;
}

/**
 * Returns localized rarity name (e.g. "Comune" / "Common").
 */
export function getRarityLabel(rarity?: string | null, lang: AppLanguage = 'en'): string {
  if (!rarity) return '';
  const key = `rarities.${rarity}`;
  return translate(lang, key);
}

/**
 * Multi-language search fields: guarantees an item is found by its current localized name,
 * default English name, any translations, or hyphen-case ID.
 */
export function getItemSearchFields(item: ItemInfo): string[] {
  const fields = [item.name, item.id];
  if (item.translations) {
    for (const tr of Object.values(item.translations)) {
      if (tr.name && !fields.includes(tr.name)) {
        fields.push(tr.name);
      }
    }
  }
  return fields;
}

/**
 * Describes which field caused an item to match a search query, when the match
 * is not on the primary displayed name (no badge needed in that case).
 */
export type ItemSearchMatchReason =
  | { kind: 'translation'; lang: string; value: string }
  | { kind: 'id' }
  | null;

/**
 * Returns why an item matched `query` when the reason is not obvious from the
 * displayed name. Returns null when query is empty or when `displayedName`
 * itself matches (the user can already see the reason).
 */
export function getItemSearchMatch(
  item: ItemInfo,
  query: string,
  displayedName: string,
): ItemSearchMatchReason {
  if (!query) return null;
  if (fuzzyMatch(displayedName, query)) return null;
  if (item.translations) {
    for (const [lang, tr] of Object.entries(item.translations)) {
      if (tr.name && tr.name !== displayedName && fuzzyMatch(tr.name, query)) {
        return { kind: 'translation', lang, value: tr.name };
      }
    }
  }
  if (item.name !== displayedName && fuzzyMatch(item.name, query)) {
    return { kind: 'translation', lang: 'en', value: item.name };
  }
  if (fuzzyMatch(item.id, query)) return { kind: 'id' };
  return null;
}

/**
 * Multi-language search fields for a List: default name, id, and all translated names.
 */
export function getListSearchFields(list: List): string[] {
  const fields = [list.name, list.id];
  if (list.translations) {
    for (const tr of Object.values(list.translations)) {
      if (tr.name && !fields.includes(tr.name)) {
        fields.push(tr.name);
      }
    }
  }
  return fields;
}
