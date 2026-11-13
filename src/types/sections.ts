import type { FeatureFlagId } from '@/lib/featureFlags';

/** Macro-moduli di 1° livello configurabili dall'utente (#102) */
export type MacroSectionId =
  | 'raid'
  | 'expeditions'
  | 'projects'
  | 'quests'
  | 'skill-tree'
  | 'trackers'
  | 'reward-pass'
  | 'codex'
  | 'maps'
  | 'role-maker';

/** Sotto-moduli granulari dipendenti da un macro-modulo (#102) */
export type SubSectionId =
  | 'raid-checklist'
  | 'expeditions-vault'
  | 'blueprints'
  | 'furniture-designs'
  | 'weapon-stencils'
  | 'outfits'
  | 'trophies'
  | 'maps-waypoints';

/** Sezioni infrastrutturali core sempre attive e non disattivabili (#102) */
export type CoreSectionId =
  | 'workbench'
  | 'stash'
  | 'settings';

export type SectionId = MacroSectionId | SubSectionId | CoreSectionId;

export type SectionDefinition = {
  id: SectionId;
  parentId?: MacroSectionId;
  nameKey: string;
  descriptionKey: string;
  systemFlag?: FeatureFlagId;
  navIds?: string[];
  routes?: string[];
  isCore?: boolean;
  defaultEnabled: boolean;
};
