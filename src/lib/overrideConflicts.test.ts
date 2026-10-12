import { describe, it, expect } from 'vitest';
import {
  adoptUpstream,
  getActiveConflicts,
  markConflictsResolved,
  type OverrideConflict,
} from './overrideConflicts';

const changed: OverrideConflict = {
  id: 'pulse-mine', key: 'subcategory', kind: 'changed',
  oldUpstream: 'Quick Use', newUpstream: null, overrideVal: 'Trap', detectedAt: '2026-10-08',
};
const redundant: OverrideConflict = {
  id: 'pulse-mine', key: 'item_type', kind: 'redundant',
  oldUpstream: null, newUpstream: 'Quick Use', overrideVal: 'Quick Use', detectedAt: '2026-10-08',
};
const orphan: OverrideConflict = {
  id: 'gone-item', key: '*', kind: 'orphan',
  oldUpstream: null, newUpstream: null, overrideVal: ['name'], detectedAt: '2026-10-08',
};

const overrides = {
  'pulse-mine': { subcategory: 'Trap', item_type: 'Quick Use' },
  'gone-item': { name: 'X' },
};

describe('overrideConflicts', () => {
  it('lists only conflicts whose override still exists', () => {
    const active = getActiveConflicts([changed, redundant, orphan], { 'pulse-mine': { subcategory: 'Trap' } });
    expect(active).toEqual([changed]);
  });

  it('hides kept conflicts until upstream moves again, storing the review on the override', () => {
    const kept = markConflictsResolved(overrides, [changed]);
    expect(kept['pulse-mine']).toEqual({
      subcategory: 'Trap',
      item_type: 'Quick Use',
      reviewed: { subcategory: 'changed|null' },
    });
    expect(getActiveConflicts([changed], kept)).toEqual([]);
    const moved = { ...changed, newUpstream: 'Gadget' };
    expect(getActiveConflicts([moved], kept)).toEqual([moved]);
  });

  it('adopting upstream also forgets the review of that field', () => {
    const kept = markConflictsResolved(overrides, [changed]);
    expect(adoptUpstream(kept, [changed])).toEqual({
      'pulse-mine': { item_type: 'Quick Use' },
      'gone-item': { name: 'X' },
    });
  });

  it('adopting upstream removes the field, and the whole entry when it becomes empty', () => {
    const result = adoptUpstream(overrides, [changed, redundant, orphan]);
    expect(result).toEqual({});
    expect(adoptUpstream(overrides, [redundant])).toEqual({
      'pulse-mine': { subcategory: 'Trap' },
      'gone-item': { name: 'X' },
    });
  });

  it('does not mutate the input overrides', () => {
    adoptUpstream(overrides, [changed]);
    expect(overrides['pulse-mine']).toEqual({ subcategory: 'Trap', item_type: 'Quick Use' });
  });
});
