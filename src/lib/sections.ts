import type {
  SectionId,
  MacroSectionId,
  SectionDefinition,
} from '@/types';
import { isFeatureEnabled } from '@/lib/featureFlags';

export const SECTIONS_REGISTRY: readonly SectionDefinition[] = [
  // --- Core (Sempre attive, card visibili in impostazioni ma bloccate) ---
  {
    id: 'workbench',
    nameKey: 'modules.workbench.name',
    descriptionKey: 'modules.workbench.description',
    isCore: true,
    defaultEnabled: true,
    routes: ['benches', 'workbench'],
    navIds: ['workbench'],
  },
  {
    id: 'stash',
    nameKey: 'modules.stash.name',
    descriptionKey: 'modules.stash.description',
    isCore: true,
    defaultEnabled: true,
    routes: ['stash'],
    navIds: ['stash'],
  },
  {
    id: 'settings',
    nameKey: 'modules.settings.name',
    descriptionKey: 'modules.settings.description',
    isCore: true,
    defaultEnabled: true,
    routes: ['settings'],
    navIds: ['settings'],
  },

  // --- Macro-Moduli & Sotto-Moduli Utente ---
  {
    id: 'raid',
    nameKey: 'modules.raid.name',
    descriptionKey: 'modules.raid.description',
    defaultEnabled: true,
    routes: ['raid'],
    navIds: ['raid'],
  },
  {
    id: 'expeditions',
    nameKey: 'modules.expeditions.name',
    descriptionKey: 'modules.expeditions.description',
    systemFlag: 'expeditions',
    defaultEnabled: true,
    routes: ['expeditions'],
    navIds: ['expeditions'],
  },
  {
    id: 'expeditions-vault',
    parentId: 'expeditions',
    nameKey: 'modules.vault.name',
    descriptionKey: 'modules.vault.description',
    systemFlag: 'vault',
    defaultEnabled: true,
    routes: ['vault'],
    navIds: ['vault'],
  },
  {
    id: 'projects',
    nameKey: 'modules.projects.name',
    descriptionKey: 'modules.projects.description',
    defaultEnabled: true,
    routes: ['projects'],
    navIds: ['projects'],
  },
  {
    id: 'trackers',
    nameKey: 'modules.trackers.name',
    descriptionKey: 'modules.trackers.description',
    defaultEnabled: true,
  },
  {
    id: 'blueprints',
    parentId: 'trackers',
    nameKey: 'modules.blueprints.name',
    descriptionKey: 'modules.blueprints.description',
    systemFlag: 'blueprints',
    defaultEnabled: true,
    routes: ['blueprints'],
    navIds: ['blueprints'],
  },
  {
    id: 'reward-pass',
    nameKey: 'modules.rewardPass.name',
    descriptionKey: 'modules.rewardPass.description',
    systemFlag: 'reward-pass',
    defaultEnabled: true,
    routes: ['reward-pass'],
    navIds: ['reward-pass'],
  },
  {
    id: 'role-maker',
    nameKey: 'modules.roleMaker.name',
    descriptionKey: 'modules.roleMaker.description',
    systemFlag: 'role-maker',
    defaultEnabled: true,
    routes: ['role-maker'],
    navIds: ['role-maker'],
  },
  {
    id: 'maps',
    nameKey: 'modules.maps.name',
    descriptionKey: 'modules.maps.description',
    systemFlag: 'maps',
    defaultEnabled: true,
    routes: ['maps'],
    navIds: ['maps'],
  },
];

export const SECTIONS_MAP: Record<SectionId, SectionDefinition> = Object.fromEntries(
  SECTIONS_REGISTRY.map((s) => [s.id, s]),
) as Record<SectionId, SectionDefinition>;

export function isCoreSection(sectionId: SectionId): boolean {
  return SECTIONS_MAP[sectionId]?.isCore ?? false;
}

export function getDefaultEnabledSections(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const s of SECTIONS_REGISTRY) {
    result[s.id] = s.defaultEnabled;
  }
  return result;
}

let storeGetter: (() => Record<string, boolean> | undefined) | null = null;

/** Registra una funzione getter per accedere allo stato dello store senza dipendenze circolari */
export function setSectionsStoreGetter(getter: () => Record<string, boolean> | undefined): void {
  storeGetter = getter;
}

/**
 * Verifica se un modulo o sotto-modulo è abilitato a livello di sistema dagli sviluppatori.
 * Per essere abilitato, sia il modulo sia il suo genitore (se presente) devono avere i relativi systemFlag a true.
 */
export function isSystemSectionEnabled(sectionId: SectionId): boolean {
  const def = SECTIONS_MAP[sectionId];
  if (!def) return false;
  if (def.isCore) return true;
  if (def.systemFlag && !isFeatureEnabled(def.systemFlag)) return false;
  if (def.parentId) {
    const parentDef = SECTIONS_MAP[def.parentId];
    if (parentDef?.systemFlag && !isFeatureEnabled(parentDef.systemFlag)) return false;
  }
  return true;
}

/**
 * Verifica se una sezione è attiva in run-time combinando:
 * 1. Invariante Core (sempre true per workbench, stash, settings)
 * 2. Invariante di Sistema (systemFlag abilitato sia per il modulo sia per il suo genitore se presente)
 * 3. Invariante di Profilo (user setting abilitato sia per il modulo sia per il suo macro-modulo genitore)
 */
export function isSectionActive(
  sectionId: SectionId,
  state?: { enabledSections?: Record<string, boolean> },
): boolean {
  if (isCoreSection(sectionId)) return true;

  // 1. Invariante di Sistema
  if (!isSystemSectionEnabled(sectionId)) return false;

  // 2. Invariante di Profilo
  const enabledSections = state?.enabledSections ?? (storeGetter ? storeGetter() : undefined);
  if (!enabledSections) return true;

  // Se la sezione è esplicitamente disattivata dall'utente
  if (enabledSections[sectionId] === false) return false;

  // Se ha un macro-modulo genitore, verifica che anche il genitore sia attivo per il profilo
  const def = SECTIONS_MAP[sectionId];
  if (def?.parentId && enabledSections[def.parentId] === false) {
    return false;
  }

  return true;
}

const NAV_TO_SECTION_MAP: Record<string, SectionId> = {
  blueprints: 'blueprints',
  expeditions: 'expeditions',
  'reward-pass': 'reward-pass',
  raid: 'raid',
  vault: 'expeditions-vault',
  'role-maker': 'role-maker',
  maps: 'maps',
};

/** Verifica se un elemento della navigazione è attivo */
export function isNavIdActive(
  navId: string,
  state?: { enabledSections?: Record<string, boolean> },
): boolean {
  const sectionId = NAV_TO_SECTION_MAP[navId];
  if (!sectionId) return true;
  return isSectionActive(sectionId, state);
}

/** Restituisce l'elenco delle definizioni di sezioni da mostrare nelle Impostazioni (filtrate per sistema) */
export function getVisibleSectionsForConfig(): SectionDefinition[] {
  return SECTIONS_REGISTRY.filter((s) => isSystemSectionEnabled(s.id));
}

/** Restituisce i sotto-moduli figli registrati per un macro-modulo */
export function getSubSectionsForMacro(macroId: MacroSectionId): SectionDefinition[] {
  return SECTIONS_REGISTRY.filter((s) => s.parentId === macroId && isSystemSectionEnabled(s.id));
}
