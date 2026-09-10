import { describe, it, expect } from 'vitest';
import { hydrateProfile, freshProfile } from '@/store/gameData';

describe('hydrateProfile / freshProfile language', () => {
  it('leaves language undefined when the persisted slice has none, so callers can fall back to the global setting', () => {
    expect(hydrateProfile({}).language).toBeUndefined();
    expect(freshProfile().language).toBeUndefined();
  });

  it('preserves an explicit per-profile language', () => {
    expect(hydrateProfile({ language: 'it' }).language).toBe('it');
  });
});
