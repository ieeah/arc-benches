import { describe, it, expect } from 'vitest';
import { AppearanceConfigSection } from './AppearanceConfigSection';
import { NavigationErgonomicsSection } from './NavigationErgonomicsSection';
import { ProfilesManagerSection } from './ProfilesManagerSection';
import { BackupPortabilitySection } from './BackupPortabilitySection';
import { AppInfoSection } from './AppInfoSection';
import { SettingsPage } from '@/pages/SettingsPage';

describe('Settings modular components', () => {
  it('exports all atomic sections as React components', () => {
    expect(typeof AppearanceConfigSection).toBe('function');
    expect(typeof NavigationErgonomicsSection).toBe('function');
    expect(typeof ProfilesManagerSection).toBe('function');
    expect(typeof BackupPortabilitySection).toBe('function');
    expect(typeof AppInfoSection).toBe('function');
    expect(typeof SettingsPage).toBe('function');
  });
});
