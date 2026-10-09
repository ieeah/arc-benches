import { describe, it, expect } from 'vitest';
import type { ItemInfo, PassList } from '@/types';
import { getPassRewards, getTrackName, splitPassesByCompletion, summarizePassRewards } from './rewardPass';

const item = (id: string, item_type: string): ItemInfo => ({
  id, name: id, description: '', icon: null, rarity: 'Common', item_type,
  subcategory: null, value: null, workbench: null, loot_area: null, stack_size: null,
});

const itemsInfo = {
  coins: item('coins', 'Currency'),
  'raider-tokens': item('raider-tokens', 'Currency'),
  'bp-1': item('bp-1', 'Blueprint'),
  'bp-2': item('bp-2', 'Blueprint'),
  suit: item('suit', 'Outfits'),
};

const pass: PassList = {
  id: 'p',
  name: 'P',
  listType: 'pass',
  maxLevel: 3,
  tracks: [{ id: 'free', name: 'Free' }, { id: 'premium', name: 'Premium', translations: { it: { name: 'Premium IT' } } }],
  levels: [
    { level: 1, requirementItemIds: [], rewards: [{ itemId: 'coins', quantity: 1000, track: 'free' }, { itemId: 'bp-1', quantity: 1, track: 'premium' }] },
    { level: 2, requirementItemIds: [], rewards: [{ itemId: 'coins', quantity: 500 }, { itemId: 'suit', quantity: 1, track: 'premium' }, { itemId: 'raider-tokens', quantity: 50, track: 'free' }] },
    { level: 3, requirementItemIds: [], rewards: [{ itemId: 'bp-2', quantity: 2, track: 'premium' }, { itemId: 'gone', quantity: 3, track: 'free' }] },
  ],
};

describe('summarizePassRewards', () => {
  it('sums currencies per item and groups the rest by item type, highest first', () => {
    const s = summarizePassRewards(pass, itemsInfo);
    expect(s.currencies).toEqual([{ itemId: 'coins', quantity: 1500 }, { itemId: 'raider-tokens', quantity: 50 }]);
    expect(s.types).toEqual([{ type: 'Blueprint', quantity: 3 }, { type: 'Other', quantity: 3 }, { type: 'Outfits', quantity: 1 }]);
    expect(s.total).toBe(1000 + 1 + 500 + 1 + 50 + 2 + 3);
  });

  it('restricts to one track, counting rewards without a track as the first one', () => {
    const free = summarizePassRewards(pass, itemsInfo, 'free');
    expect(free.currencies).toEqual([{ itemId: 'coins', quantity: 1500 }, { itemId: 'raider-tokens', quantity: 50 }]);
    expect(free.types).toEqual([{ type: 'Other', quantity: 3 }]);
    const premium = summarizePassRewards(pass, itemsInfo, 'premium');
    expect(premium.currencies).toEqual([]);
    expect(premium.types).toEqual([{ type: 'Blueprint', quantity: 3 }, { type: 'Outfits', quantity: 1 }]);
  });

  it('handles a pass with no rewards', () => {
    const empty: PassList = { ...pass, levels: [{ level: 1, requirementItemIds: [] }] };
    expect(summarizePassRewards(empty, itemsInfo)).toEqual({ currencies: [], types: [], total: 0 });
    expect(getPassRewards(empty)).toEqual([]);
  });
});

describe('getTrackName', () => {
  it('prefers the translation and falls back to the default name', () => {
    expect(getTrackName(pass.tracks[1], 'it')).toBe('Premium IT');
    expect(getTrackName(pass.tracks[1], 'en')).toBe('Premium');
    expect(getTrackName(pass.tracks[0], 'it')).toBe('Free');
  });
});

describe('splitPassesByCompletion', () => {
  it('separates completed passes from the ones still available', () => {
    const other = { ...pass, id: 'q' };
    const { available, completed } = splitPassesByCompletion([pass, other], new Set(['q']));
    expect(available.map(p => p.id)).toEqual(['p']);
    expect(completed.map(p => p.id)).toEqual(['q']);
  });
});
