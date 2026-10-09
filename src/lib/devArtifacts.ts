/**
 * File che gli strumenti Dev producono a partire dalle bozze in localStorage, con un unico punto
 * che sa come ricostruirli: la dashboard Dev li elenca, li scarica (anche in ZIP) e ripristina le
 * bozze, e le pagine Dev usano lo stesso costruttore per il loro pulsante "Scarica".
 * Ogni file mantiene la forma di quello nel repo, cosi' sovrascriverlo non rompe l'app.
 */
import type { List, ListType } from '@/types';
import type { AppRoute } from '@/router';
import defaultWorkbenchesData from '@/data/workbenches.json';
import itemsOverridesData from '@/data/items-overrides.json';
import featureFlagsSeed from '@/data/feature-flags.json';
import { DRAFT_STORAGE_KEY, getInitialData } from '@/hooks/dev/useDevListDrafts';
import { clearNavDraft, getSeedNavConfig, readNavDraft } from '@/lib/navTree';
import { getFeatureFlags, hasCustomFeatureFlags, resetFeatureFlags } from '@/lib/featureFlags';
import {
  CUSTOM_ITEMS_FILE,
  CUSTOM_ITEMS_ICONS_DIR,
  baselineCustomItems,
  buildCustomItemsFileContent,
  clearCustomItemsDraft,
  getEffectiveCustomItems,
  getPendingIcons,
  isCustomItemsModified,
} from '@/lib/customItems';
import {
  DEFAULT_FLAT,
  buildLocaleFileSource,
  clearI18nDraft,
  getEffectiveFlatLocale,
  type I18nLang,
} from '@/lib/devI18n';

const OVERRIDES_DRAFT_KEY = 'dev_items_overrides_draft';

export interface DevArtifact {
  id: string;
  /** Percorso nel repo (relativo alla radice): lo ZIP lo usa come percorso interno. */
  file: string;
  label: string;
  /** Pagina Dev che modifica questo file. */
  route: AppRoute;
  isModified: () => boolean;
  build: () => string;
  /**
   * Il file com'era quando l'app l'ha caricato (forma canonica per i `.json`, testo per i `.ts`):
   * il server di sviluppo lo confronta con il disco per non sovrascrivere modifiche fatte a mano.
   */
  baseline: () => string;
  /** Scarta la bozza e torna al file incluso nell'app. */
  reset: () => void;
  /** File binari (data URL base64) da scrivere accanto al file principale, es. le icone caricate. */
  binaryFiles?: () => { path: string; base64: string }[];
  /** Eseguito dopo una scrittura riuscita nel progetto (es. per svuotare i dati che hanno solo valore di bozza). */
  afterApply?: () => void;
}

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* storage non disponibile o JSON corrotto */ }
  return null;
}

// ── liste ────────────────────────────────────────────────────────────────────

const LIST_FILES: { type: Exclude<ListType, 'custom'>; file: string; label: string }[] = [
  { type: 'workbench', file: 'src/data/workbenches.json', label: 'Banchi da lavoro' },
  { type: 'expedition', file: 'src/data/expeditions.json', label: 'Spedizioni' },
  { type: 'project', file: 'src/data/projects.json', label: 'Progetti' },
  { type: 'quest', file: 'src/data/quests.json', label: 'Quest' },
];

/**
 * Contenuto del file di un tipo di lista. I banchi vivono in `{ ...metadati, items }` (formato
 * dell'API di origine, letto da `computeEffectiveWorkbenches`), gli altri in `{ lists }`.
 */
export function buildListsFileContent(type: ListType, lists: List[]): string {
  if (type === 'workbench') {
    return json({ ...defaultWorkbenchesData, total: lists.length, count: lists.length, items: lists });
  }
  return json({ lists });
}

function listsDraft(): Partial<Record<ListType, List[]>> | null {
  return readJson<Partial<Record<ListType, List[]>>>(DRAFT_STORAGE_KEY);
}

function listsArtifact({ type, file, label }: (typeof LIST_FILES)[number]): DevArtifact {
  const baseline = () => getInitialData()[type];
  const current = () => listsDraft()?.[type] ?? baseline();
  return {
    id: `lists-${type}`,
    file,
    label,
    route: 'dev-lists',
    isModified: () => JSON.stringify(current()) !== JSON.stringify(baseline()),
    build: () => buildListsFileContent(type, current()),
    baseline: () => (type === 'workbench' ? JSON.stringify(defaultWorkbenchesData) : JSON.stringify({ lists: baseline() })),
    reset: () => {
      const draft = listsDraft();
      if (!draft) return;
      const next = { ...draft, [type]: baseline() };
      const allDefault = LIST_FILES.every(f => JSON.stringify(next[f.type]) === JSON.stringify(getInitialData()[f.type]));
      try {
        if (allDefault && !(next.custom && next.custom.length)) localStorage.removeItem(DRAFT_STORAGE_KEY);
        else localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
    },
  };
}

// ── altri file ───────────────────────────────────────────────────────────────

const overridesArtifact: DevArtifact = {
  id: 'items-overrides',
  file: 'src/data/items-overrides.json',
  label: 'Override oggetti',
  route: 'dev-overrides',
  isModified: () => {
    const draft = readJson<unknown>(OVERRIDES_DRAFT_KEY);
    return draft !== null && JSON.stringify(draft) !== JSON.stringify(itemsOverridesData);
  },
  build: () => json(readJson<unknown>(OVERRIDES_DRAFT_KEY) ?? itemsOverridesData),
  baseline: () => JSON.stringify(itemsOverridesData),
  reset: () => {
    try { localStorage.removeItem(OVERRIDES_DRAFT_KEY); } catch { /* ignore */ }
  },
};

const customItemsArtifact: DevArtifact = {
  id: 'custom-items',
  file: CUSTOM_ITEMS_FILE,
  label: 'Oggetti custom',
  route: 'dev-custom-items',
  isModified: isCustomItemsModified,
  build: () => buildCustomItemsFileContent(getEffectiveCustomItems()),
  baseline: () => JSON.stringify(baselineCustomItems),
  reset: clearCustomItemsDraft,
  binaryFiles: () =>
    Object.entries(getPendingIcons()).flatMap(([name, dataUrl]) => {
      const base64 = dataUrl.split(',')[1];
      return base64 ? [{ path: `${CUSTOM_ITEMS_ICONS_DIR}/${name}`, base64 }] : [];
    }),
  afterApply: clearCustomItemsDraft,
};

const navArtifact: DevArtifact = {
  id: 'nav',
  file: 'src/data/nav.json',
  label: 'Menu di navigazione',
  route: 'dev-nav',
  isModified: () => {
    const draft = readNavDraft();
    return draft !== null && JSON.stringify(draft) !== JSON.stringify(getSeedNavConfig());
  },
  build: () => json(readNavDraft() ?? getSeedNavConfig()),
  baseline: () => JSON.stringify(getSeedNavConfig()),
  reset: clearNavDraft,
};

const flagsArtifact: DevArtifact = {
  id: 'feature-flags',
  file: 'src/data/feature-flags.json',
  label: 'Feature flags',
  route: 'dev-flags',
  isModified: hasCustomFeatureFlags,
  build: () => json(getFeatureFlags()),
  baseline: () => JSON.stringify(featureFlagsSeed),
  reset: resetFeatureFlags,
};

function localeArtifact(lang: I18nLang): DevArtifact {
  return {
    id: `locale-${lang}`,
    file: `src/i18n/locales/${lang}.ts`,
    label: `Traduzioni ${lang.toUpperCase()}`,
    route: 'dev-translations',
    isModified: () => JSON.stringify(getEffectiveFlatLocale(lang)) !== JSON.stringify(DEFAULT_FLAT[lang]),
    build: () => buildLocaleFileSource(lang),
    baseline: () => buildLocaleFileSource(lang, DEFAULT_FLAT[lang]),
    reset: () => clearI18nDraft(lang),
  };
}

export function getDevArtifacts(): DevArtifact[] {
  return [
    ...LIST_FILES.map(listsArtifact),
    overridesArtifact,
    customItemsArtifact,
    navArtifact,
    flagsArtifact,
    localeArtifact('it'),
    localeArtifact('en'),
  ];
}
