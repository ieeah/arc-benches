import { it as defaultIt } from '@/i18n/locales/it';
import { en as defaultEn } from '@/i18n/locales/en';

/**
 * Dev-only shared utility for the i18n draft workflow. Both DevTranslationsPage and
 * DevNavPage edit the same `dev_i18n_{lang}_draft` localStorage keys (a full flat dict,
 * merged by `computeEffectiveLocales()` at module load — changes apply on reload) and
 * export the same `src/i18n/locales/*.ts` files. This module is the single source of
 * that logic so the two pages never duplicate it.
 */

export type I18nLang = 'it' | 'en';

const DRAFT_KEY: Record<I18nLang, string> = {
  it: 'dev_i18n_it_draft',
  en: 'dev_i18n_en_draft',
};

// ── flatten / unflatten ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenLocale(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flattenLocale(v, path));
    else if (typeof v === 'string') out[path] = v;
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unflattenLocale(flat: Record<string, string>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Record<string, any> = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return out;
}

export const DEFAULT_FLAT: Record<I18nLang, Record<string, string>> = {
  it: flattenLocale(defaultIt),
  en: flattenLocale(defaultEn),
};

// ── draft read / write ──────────────────────────────────────────────────────

export function readI18nDraft(lang: I18nLang): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY[lang]);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch { /* ignore */ }
  return null;
}

export function writeI18nDraft(lang: I18nLang, flat: Record<string, string>): void {
  try {
    localStorage.setItem(DRAFT_KEY[lang], JSON.stringify(flat));
  } catch { /* ignore */ }
}

export function clearI18nDraft(lang: I18nLang): void {
  try {
    localStorage.removeItem(DRAFT_KEY[lang]);
  } catch { /* ignore */ }
}

/** The effective flat dict for a language: draft if present, else the bundled default. */
export function getEffectiveFlatLocale(lang: I18nLang): Record<string, string> {
  return readI18nDraft(lang) ?? { ...DEFAULT_FLAT[lang] };
}

// ── single-key helpers (DevNavPage inline editor) ───────────────────────────

/** Effective value for `key`: draft override, else bundled default, else '' (unknown key). */
export function getTranslationValue(lang: I18nLang, key: string): string {
  const draft = readI18nDraft(lang);
  if (draft && key in draft) return draft[key];
  return DEFAULT_FLAT[lang][key] ?? '';
}

export function getDefaultTranslationValue(lang: I18nLang, key: string): string {
  return DEFAULT_FLAT[lang][key] ?? '';
}

/** True when the draft value for `key` differs from the bundled default. */
export function hasTranslationOverride(lang: I18nLang, key: string): boolean {
  const draft = readI18nDraft(lang);
  if (!draft || !(key in draft)) return false;
  return draft[key] !== (DEFAULT_FLAT[lang][key] ?? '');
}

/** Sets `key` in the `lang` draft, seeding from the full default dict on first write. */
export function setTranslationValue(lang: I18nLang, key: string, value: string): void {
  const draft = readI18nDraft(lang) ?? { ...DEFAULT_FLAT[lang] };
  draft[key] = value;
  writeI18nDraft(lang, draft);
}

// ── export: locale source files ─────────────────────────────────────────────

/**
 * Regenerates the full `src/i18n/locales/<lang>.ts` source from a flat dict
 * (defaults to the effective one). Matches the file shape the app imports.
 */
export function buildLocaleFileSource(lang: I18nLang, flat: Record<string, string> = getEffectiveFlatLocale(lang)): string {
  const structured = JSON.stringify(unflattenLocale(flat), null, 2);
  return lang === 'it'
    ? `export const it = ${structured};\n\nexport type LocaleSchema = typeof it;\n`
    : `import type { LocaleSchema } from './it';\n\nexport const en: LocaleSchema = ${structured};\n`;
}

/** Combined `{ it, en }` JSON (defaults to the effective dicts). */
export function buildCombinedLocalesJson(
  itFlat: Record<string, string> = getEffectiveFlatLocale('it'),
  enFlat: Record<string, string> = getEffectiveFlatLocale('en'),
): string {
  return JSON.stringify({ it: unflattenLocale(itFlat), en: unflattenLocale(enFlat) }, null, 2);
}

/** Number of keys whose effective value differs from the bundled default, across both langs. */
export function countModifiedKeys(): number {
  const itFlat = getEffectiveFlatLocale('it');
  const enFlat = getEffectiveFlatLocale('en');
  const keys = new Set([...Object.keys(DEFAULT_FLAT.it), ...Object.keys(itFlat), ...Object.keys(enFlat)]);
  let n = 0;
  for (const k of keys) {
    if (itFlat[k] !== DEFAULT_FLAT.it[k] || enFlat[k] !== DEFAULT_FLAT.en[k]) n++;
  }
  return n;
}

// ── generic browser download ───────────────────────────────────────────────

export function downloadTextFile(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Downloads `<lang>.ts` regenerated from the current draft. */
export function downloadLocaleFile(lang: I18nLang): void {
  downloadTextFile(`${lang}.ts`, buildLocaleFileSource(lang), 'text/typescript');
}
