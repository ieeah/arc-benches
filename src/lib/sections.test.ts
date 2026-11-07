import { describe, it, expect } from 'vitest';
import {
  isCoreSection,
  getDefaultEnabledSections,
  isSystemSectionEnabled,
  isSectionActive,
  isNavIdActive,
  getVisibleSectionsForConfig,
  getSubSectionsForMacro,
  getSectionDeactivationWarning,
} from './sections';

describe('sections logic', () => {
  it('correctly identifies core non-disableable sections', () => {
    expect(isCoreSection('workbench')).toBe(true);
    expect(isCoreSection('stash')).toBe(true);
    expect(isCoreSection('settings')).toBe(true);
    expect(isCoreSection('raid')).toBe(false);
    expect(isCoreSection('expeditions')).toBe(false);
    expect(isCoreSection('blueprints')).toBe(false);
  });

  it('provides all default enabled sections', () => {
    const defaults = getDefaultEnabledSections();
    expect(defaults.workbench).toBe(true);
    expect(defaults.stash).toBe(true);
    expect(defaults.raid).toBe(true);
    expect(defaults.projects).toBe(true);
    expect(defaults.trackers).toBe(true);
    expect(defaults.blueprints).toBe(true);
  });

  it('respects system feature flag gating', () => {
    // blueprints e reward-pass sono abilitati nel seed (true)
    expect(isSystemSectionEnabled('blueprints')).toBe(true);
    expect(isSystemSectionEnabled('reward-pass')).toBe(true);

    // maps è disabilitato nel seed (false)
    expect(isSystemSectionEnabled('maps')).toBe(false);
  });

  it('ensures core sections are active even if explicitly set to false in profile', () => {
    const disabledCoreState = {
      enabledSections: {
        workbench: false,
        stash: false,
        settings: false,
      },
    };

    expect(isSectionActive('workbench', disabledCoreState)).toBe(true);
    expect(isSectionActive('stash', disabledCoreState)).toBe(true);
    expect(isSectionActive('settings', disabledCoreState)).toBe(true);
  });

  it('respects user profile toggles for optional macro-modules', () => {
    expect(isSectionActive('raid', { enabledSections: { raid: true } })).toBe(true);
    expect(isSectionActive('raid', { enabledSections: { raid: false } })).toBe(false);

    expect(isSectionActive('projects', { enabledSections: { projects: true } })).toBe(true);
    expect(isSectionActive('projects', { enabledSections: { projects: false } })).toBe(false);
  });

  it('cascades macro-module deactivation to sub-modules', () => {
    // Se trackers (genitore) è false, blueprints (figlio) deve risultare false
    // anche se blueprints fosse salvato a true nel profilo
    const trackersDisabled = {
      enabledSections: {
        trackers: false,
        blueprints: true,
      },
    };
    expect(isSectionActive('trackers', trackersDisabled)).toBe(false);
    expect(isSectionActive('blueprints', trackersDisabled)).toBe(false);

    // Se trackers è true, blueprints segue il proprio flag
    const blueprintsDisabled = {
      enabledSections: {
        trackers: true,
        blueprints: false,
      },
    };
    expect(isSectionActive('trackers', blueprintsDisabled)).toBe(true);
    expect(isSectionActive('blueprints', blueprintsDisabled)).toBe(false);

    const bothEnabled = {
      enabledSections: {
        trackers: true,
        blueprints: true,
      },
    };
    expect(isSectionActive('trackers', bothEnabled)).toBe(true);
    expect(isSectionActive('blueprints', bothEnabled)).toBe(true);
  });

  it('correctly gates navigation IDs via isNavIdActive', () => {
    expect(isNavIdActive('stash')).toBe(true);
    expect(isNavIdActive('liste')).toBe(true);

    expect(isNavIdActive('raid', { enabledSections: { raid: true } })).toBe(true);
    expect(isNavIdActive('raid', { enabledSections: { raid: false } })).toBe(false);

    expect(isNavIdActive('blueprints', { enabledSections: { trackers: false } })).toBe(false);
    expect(isNavIdActive('blueprints', { enabledSections: { trackers: true, blueprints: false } })).toBe(false);
    expect(isNavIdActive('blueprints', { enabledSections: { trackers: true, blueprints: true } })).toBe(true);
  });

  it('filters visible sections for config based on system flags', () => {
    const visible = getVisibleSectionsForConfig();
    const visibleIds = visible.map((v) => v.id);

    // Core e moduli con flag di sistema true devono essere visibili
    expect(visibleIds).toContain('workbench');
    expect(visibleIds).toContain('stash');
    expect(visibleIds).toContain('settings');
    expect(visibleIds).toContain('raid');
    expect(visibleIds).toContain('projects');
    expect(visibleIds).toContain('blueprints');

    // maps è disabilitato a sistema e non deve comparire
    expect(visibleIds).not.toContain('maps');
  });

  it('retrieves sub-sections for a macro-module', () => {
    const trackerChildren = getSubSectionsForMacro('trackers');
    expect(trackerChildren.map((c) => c.id)).toContain('blueprints');
  });

  describe('getSectionDeactivationWarning', () => {
    it('detects active progress in raid planning', () => {
      // Empty plan -> no warning
      expect(getSectionDeactivationWarning('raid', { raidPlan: { isRaidRunning: false, actions: [], items: [] } }).hasProgress).toBe(false);

      // Running raid -> warning
      expect(getSectionDeactivationWarning('raid', { raidPlan: { isRaidRunning: true, actions: [], items: [] } }).hasProgress).toBe(true);

      // Items in plan -> warning
      expect(getSectionDeactivationWarning('raid', { raidPlan: { isRaidRunning: false, actions: [], items: [{ itemId: 'item-1', targetQuantity: 2 }] } }).hasProgress).toBe(true);
    });

    it('detects active progress in expeditions', () => {
      expect(getSectionDeactivationWarning('expeditions', {}).hasProgress).toBe(false);
      expect(getSectionDeactivationWarning('expeditions', { consecutiveStreak: 3 }).hasProgress).toBe(true);
      expect(getSectionDeactivationWarning('expeditions', { earnedPermanentSkillPoints: 1 }).hasProgress).toBe(true);
      expect(getSectionDeactivationWarning('expeditions', { departureWindowActive: true }).hasProgress).toBe(true);
      expect(getSectionDeactivationWarning('expeditions', { completedExpeditionsCount: 2 }).hasProgress).toBe(true);
    });

    it('detects active progress in projects', () => {
      expect(getSectionDeactivationWarning('projects', {}).hasProgress).toBe(false);

      // Level > 0 on a project
      expect(getSectionDeactivationWarning('projects', { currentLevels: { 'trophy-display': 1 } }).hasProgress).toBe(true);

      // Checked action on a project
      expect(getSectionDeactivationWarning('projects', { checkedActions: { 'trophy-display:1:action-1': true } }).hasProgress).toBe(true);
    });

    it('detects active progress in reward pass', () => {
      expect(getSectionDeactivationWarning('reward-pass', {}).hasProgress).toBe(false);
      expect(getSectionDeactivationWarning('reward-pass', { activeRewardPass: 's1-pass' }).hasProgress).toBe(true);
      expect(getSectionDeactivationWarning('reward-pass', { completedRewardPasses: [{ passId: 's1-pass', completedAt: 123 }] }).hasProgress).toBe(true);
    });

    it('detects active progress in blueprints and cascades to trackers macro', () => {
      expect(getSectionDeactivationWarning('blueprints', {}).hasProgress).toBe(false);
      expect(getSectionDeactivationWarning('blueprints', { ownedBlueprints: { 'bp-1': true } }).hasProgress).toBe(true);

      // Trackers macro detects blueprints progress
      expect(getSectionDeactivationWarning('trackers', { ownedBlueprints: { 'bp-1': true } }).hasProgress).toBe(true);
      expect(getSectionDeactivationWarning('trackers', { ownedBlueprints: { 'bp-1': false } }).hasProgress).toBe(false);
    });

    it('detects active personality in role maker', () => {
      expect(getSectionDeactivationWarning('role-maker', {}).hasProgress).toBe(false);
      expect(getSectionDeactivationWarning('role-maker', { activePersonalityId: 'sentinel' }).hasProgress).toBe(true);
    });
  });
});
