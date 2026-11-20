import type {
  SectionId,
  MacroSectionId,
  SectionDefinition,
} from '@/types';
import { isFeatureEnabled, type FeatureFlagId } from '@/lib/featureFlags';
import {
  SECTIONS_REGISTRY,
  SECTIONS_MAP,
  isCoreSection,
  getDefaultEnabledSections,
  isSystemSectionEnabled as engineIsSystemSectionEnabled,
  isSectionActive as engineIsSectionActive,
  isNavIdActive as engineIsNavIdActive,
  getVisibleSectionsForConfig as engineGetVisibleSectionsForConfig,
  getSubSectionsForMacro as engineGetSubSectionsForMacro,
  getSectionDeactivationWarning as engineGetSectionDeactivationWarning,
  type SectionDeactivationWarning,
  type SectionDeactivationState,
} from '@/engine/sections';

export {
  SECTIONS_REGISTRY,
  SECTIONS_MAP,
  isCoreSection,
  getDefaultEnabledSections,
  type SectionDeactivationWarning,
  type SectionDeactivationState,
};

const defaultSystemEnabled = (flag: string): boolean => isFeatureEnabled(flag as FeatureFlagId);

let storeGetter: (() => Record<string, boolean> | undefined) | null = null;

/** Registra una funzione getter per accedere allo stato dello store senza dipendenze circolari */
export function setSectionsStoreGetter(getter: () => Record<string, boolean> | undefined): void {
  storeGetter = getter;
}

export function isSystemSectionEnabled(
  sectionId: SectionId,
  isSystemEnabled: (flag: string) => boolean = defaultSystemEnabled,
): boolean {
  return engineIsSystemSectionEnabled(sectionId, isSystemEnabled);
}

export function isSectionActive(
  sectionId: SectionId,
  state?: { enabledSections?: Record<string, boolean> },
  isSystemEnabled: (flag: string) => boolean = defaultSystemEnabled,
): boolean {
  const resolvedState = state?.enabledSections !== undefined
    ? state
    : { enabledSections: storeGetter ? storeGetter() : undefined };
  return engineIsSectionActive(sectionId, resolvedState, isSystemEnabled);
}

export function isNavIdActive(
  navId: string,
  state?: { enabledSections?: Record<string, boolean> },
  isSystemEnabled: (flag: string) => boolean = defaultSystemEnabled,
): boolean {
  const resolvedState = state?.enabledSections !== undefined
    ? state
    : { enabledSections: storeGetter ? storeGetter() : undefined };
  return engineIsNavIdActive(navId, resolvedState, isSystemEnabled);
}

export function getVisibleSectionsForConfig(
  isSystemEnabled: (flag: string) => boolean = defaultSystemEnabled,
): SectionDefinition[] {
  return engineGetVisibleSectionsForConfig(isSystemEnabled);
}

export function getSubSectionsForMacro(
  macroId: MacroSectionId,
  isSystemEnabled: (flag: string) => boolean = defaultSystemEnabled,
): SectionDefinition[] {
  return engineGetSubSectionsForMacro(macroId, isSystemEnabled);
}

export function getSectionDeactivationWarning(
  sectionId: SectionId,
  state: SectionDeactivationState,
  isSystemEnabled: (flag: string) => boolean = defaultSystemEnabled,
): SectionDeactivationWarning {
  return engineGetSectionDeactivationWarning(sectionId, state, isSystemEnabled);
}
