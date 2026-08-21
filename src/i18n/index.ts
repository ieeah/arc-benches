import { useCallback } from 'react';
import type { ItemInfo, List } from '@/types';
import { useAppStore } from '@/store';
import { it } from './locales/it';
import { en } from './locales/en';
import { SUPPORTED_LANGUAGES, type AppLanguage } from './types';

export * from './types';

const LOCALES: Record<AppLanguage, typeof it> = {
  it,
  en,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationPath = NestedKeyOf<typeof it>;

export function translate(
  lang: AppLanguage,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = LOCALES[lang] || LOCALES.it;
  const parts = path.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to Italian
      let fallbackCurrent: any = LOCALES.it;
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
  const language = useAppStore(s => s.language ?? 'it');
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
export function getItemName(item?: ItemInfo | null, lang: AppLanguage = 'it'): string {
  if (!item) return '';
  if (lang !== 'en' && item.translations?.[lang]?.name) {
    return item.translations[lang].name!;
  }
  return item.name;
}

/**
 * Returns localized item description with intelligent fallback to default (EN) description.
 */
export function getItemDescription(item?: ItemInfo | null, lang: AppLanguage = 'it'): string {
  if (!item) return '';
  if (lang !== 'en' && item.translations?.[lang]?.description) {
    return item.translations[lang].description!;
  }
  return item.description ?? '';
}

/**
 * Returns localized workbench name.
 */
export function getWorkbenchName(workbench?: List | null, _lang: AppLanguage = 'it'): string {
  if (!workbench) return '';
  return workbench.name;
}

/**
 * Returns localized rarity name (e.g. "Comune" / "Common").
 */
export function getRarityLabel(rarity?: string | null, lang: AppLanguage = 'it'): string {
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
