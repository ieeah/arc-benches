import { describe, it, expect } from 'vitest';
import type { List, PassList } from '@/types';
import type { ListsDataMap } from '@/hooks/dev/useDevListDrafts';
import type { PassTrackTrashPayload } from '@/lib/devTrash';
import { artifactIdForBucket, restoreList, restorePassTrack } from './devTrashRestore';

const level = (n: number) => ({ level: n, requirementItemIds: [] });

const pass: PassList = {
  id: 'frozen-trail',
  name: 'Frozen Trail',
  listType: 'pass',
  maxLevel: 3,
  tracks: [{ id: 'free', name: 'Free' }, { id: 'legacy', name: 'Legacy' }],
  levels: [level(1), { ...level(2), rewards: [{ itemId: 'coins', quantity: 5, track: 'free' }] }, level(3)],
};

const data = (overrides: Partial<ListsDataMap> = {}): ListsDataMap => ({
  workbench: [], expedition: [], project: [], quest: [], pass: [pass], custom: [], ...overrides,
});

const payload: PassTrackTrashPayload = {
  listId: 'frozen-trail',
  track: { id: 'premium', name: 'Premium', locked: true },
  trackIndex: 1,
  rewards: [{ level: 2, reward: { itemId: 'xp-points', quantity: 100 } }, { level: 3, reward: { itemId: 'bp-1', quantity: 1 } }],
};

describe('restoreList', () => {
  const quest: List = { id: 'q1', name: 'Q', listType: 'quest', maxLevel: 1, levels: [level(1)] };

  it('puts the list back into the group of its type', () => {
    const result = restoreList(data(), quest);
    expect(result.ok && result.bucket).toBe('quest');
    expect(result.ok && result.data.quest.map((l) => l.id)).toEqual(['q1']);
  });

  it('refuses when any list already uses the id', () => {
    const result = restoreList(data({ project: [{ ...quest, listType: 'project' }] }), quest);
    expect(result.ok).toBe(false);
  });
});

describe('restorePassTrack', () => {
  it('re-inserts the track at its position with its rewards at their levels', () => {
    const result = restorePassTrack(data(), payload);
    expect(result.ok && result.bucket).toBe('pass');
    const restored = result.ok ? (result.data.pass[0] as PassList) : null;
    expect(restored?.tracks.map((t) => t.id)).toEqual(['free', 'premium', 'legacy']);
    expect(restored?.levels[1].rewards).toEqual([
      { itemId: 'coins', quantity: 5, track: 'free' },
      { itemId: 'xp-points', quantity: 100, track: 'premium' },
    ]);
    expect(restored?.levels[2].rewards).toEqual([{ itemId: 'bp-1', quantity: 1, track: 'premium' }]);
  });

  it('refuses when the pass is gone or the track id is taken', () => {
    expect(restorePassTrack(data({ pass: [] }), payload).ok).toBe(false);
    const taken = { ...pass, tracks: [...pass.tracks, { id: 'premium', name: 'P' }] };
    expect(restorePassTrack(data({ pass: [taken] }), payload).ok).toBe(false);
  });

  it('puts the track at the end when its old position no longer exists, and skips levels that are gone', () => {
    const shortPass = { ...pass, tracks: [pass.tracks[0]], levels: [level(1)] };
    const result = restorePassTrack(data({ pass: [shortPass] }), { ...payload, trackIndex: 9 });
    const restored = result.ok ? (result.data.pass[0] as PassList) : null;
    expect(restored?.tracks.map((t) => t.id)).toEqual(['free', 'premium']);
    expect(restored?.levels[0].rewards).toBeUndefined();
  });
});

describe('artifactIdForBucket', () => {
  it('maps a group to the file artifact, except custom lists', () => {
    expect(artifactIdForBucket('pass')).toBe('lists-pass');
    expect(artifactIdForBucket('workbench')).toBe('lists-workbench');
    expect(artifactIdForBucket('custom')).toBeNull();
  });
});
