import { describe, it, expect } from 'vitest';
import {
  isObject,
  sanitizeNumberRecord,
  sanitizeNumberArrayRecord,
  sanitizeBoolRecord,
  sanitizeStringArray,
  validateList,
  validateProfile,
  validateExpeditionIndex,
  v,
} from '@/lib/validate';

describe('isObject', () => {
  it('accepts plain objects only', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });
  it('rejects arrays, null and primitives', () => {
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject('x')).toBe(false);
    expect(isObject(3)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });
});

describe('sanitizeNumberRecord', () => {
  it('keeps finite values >= 0 and floors them', () => {
    expect(sanitizeNumberRecord({ a: 3, b: 2.9, c: 0 })).toEqual({ a: 3, b: 2, c: 0 });
  });
  it('drops negatives, NaN, Infinity and non-numbers', () => {
    expect(sanitizeNumberRecord({ a: -1, b: NaN, c: Infinity, d: '5', e: null })).toEqual({});
  });
  it('returns {} for non-objects', () => {
    expect(sanitizeNumberRecord(null)).toEqual({});
    expect(sanitizeNumberRecord([1, 2])).toEqual({});
  });
});

describe('sanitizeNumberArrayRecord', () => {
  it('filters bad elements inside arrays', () => {
    expect(sanitizeNumberArrayRecord({ a: [1, 2.5, -1, 'x', NaN, 3] })).toEqual({ a: [1, 2, 3] });
  });
  it('skips non-array values', () => {
    expect(sanitizeNumberArrayRecord({ a: 5, b: [1] })).toEqual({ b: [1] });
  });
});

describe('sanitizeBoolRecord', () => {
  it('keeps only booleans', () => {
    expect(sanitizeBoolRecord({ a: true, b: false, c: 1, d: 'true' })).toEqual({ a: true, b: false });
  });
});

describe('sanitizeStringArray', () => {
  it('keeps only strings', () => {
    expect(sanitizeStringArray(['a', 1, null, 'b'])).toEqual(['a', 'b']);
  });
  it('returns [] for non-arrays', () => {
    expect(sanitizeStringArray('a')).toEqual([]);
  });
});

describe('validateList', () => {
  const valid = {
    id: 'custom:1',
    name: 'Test',
    maxLevel: 2,
    levels: [
      { level: 1, requirementItemIds: [{ itemId: 'metal-parts', quantity: 3 }] },
      { level: 2, requirementItemIds: [], actions: [{ id: 'a1', label: 'do it' }] },
    ],
  };

  it('accepts a well-formed list', () => {
    const out = validateList(valid);
    expect(out).not.toBeNull();
    expect(out!.id).toBe('custom:1');
    expect(out!.levels).toHaveLength(2);
    expect(out!.levels[1].actions).toEqual([{ id: 'a1', label: 'do it' }]);
  });

  it('rejects missing id or name', () => {
    expect(validateList({ ...valid, id: '' })).toBeNull();
    expect(validateList({ ...valid, name: 123 })).toBeNull();
  });

  it('rejects a list with no usable levels', () => {
    expect(validateList({ ...valid, levels: [] })).toBeNull();
    expect(validateList({ ...valid, levels: [{ level: 'x', requirementItemIds: [] }] })).toBeNull();
  });

  it('drops malformed requirements but keeps the level', () => {
    const out = validateList({
      ...valid,
      levels: [{ level: 1, requirementItemIds: [{ itemId: 'ok', quantity: 1 }, { itemId: '', quantity: 2 }, { quantity: 3 }] }],
    });
    expect(out!.levels[0].requirementItemIds).toEqual([{ itemId: 'ok', quantity: 1 }]);
  });

  it('derives maxLevel from levels when missing/invalid', () => {
    const out = validateList({ ...valid, maxLevel: 'nope' });
    expect(out!.maxLevel).toBe(2);
  });

  it('forces custom listType for custom lists and preserves non-custom listType and expeditionIndex', () => {
    const customOut = validateList({ ...valid, custom: true, shared: true, listType: 'project' });
    expect(customOut!.custom).toBe(true);
    expect(customOut!.shared).toBe(true);
    expect(customOut!.listType).toBe('custom');

    const expOut = validateList({ ...valid, listType: 'expedition', expeditionIndex: 2 });
    expect(expOut!.listType).toBe('expedition');
    expect(expOut!.listType === 'expedition' && expOut!.expeditionIndex).toBe(2);
  });

  it('validates and preserves rewards and valid expirationDate', () => {
    const out = validateList({
      ...valid,
      expirationDate: '2026-10-31T20:00:00.000Z',
      levels: [
        {
          level: 1,
          requirementItemIds: [
            {
              itemId: 'metal-parts',
              quantity: 10,
              rewards: [{ itemId: 'blueprint-refiner-3', quantity: 1 }],
            },
          ],
          actions: [
            {
              id: 'act-1',
              label: 'Search the outpost',
              rewards: [{ itemId: 'xp-points', quantity: 100 }],
            },
          ],
          tieredActions: [
            {
              id: 'tier-1',
              label: 'Deal Damage',
              steps: [
                {
                  id: 'step-1',
                  label: '5000 Dmg',
                  rewards: [{ itemId: 'raider-tokens', quantity: 1 }],
                },
              ],
            },
          ],
          rewards: [
            { itemId: 'arc-alloy', quantity: 2 },
            { itemId: 'xp-points' }, // missing quantity defaults to 1
            { label: '500 XP' }, // legacy text-only reward, dropped
            { itemId: '' }, // invalid itemId, dropped
          ],
        },
      ],
    });
    expect(out!.expirationDate).toBe('2026-10-31T20:00:00.000Z');
    expect(out!.levels[0].rewards).toHaveLength(2);
    expect(out!.levels[0].rewards![0]).toEqual({ itemId: 'arc-alloy', quantity: 2 });
    expect(out!.levels[0].rewards![1]).toEqual({ itemId: 'xp-points', quantity: 1 });
    expect(out!.levels[0].requirementItemIds[0].rewards).toEqual([
      { itemId: 'blueprint-refiner-3', quantity: 1 },
    ]);
    expect(out!.levels[0].actions![0].rewards).toEqual([
      { itemId: 'xp-points', quantity: 100 },
    ]);
    expect(out!.levels[0].tieredActions![0].steps[0].rewards).toEqual([
      { itemId: 'raider-tokens', quantity: 1 },
    ]);
  });

  it('drops invalid expirationDate', () => {
    const out = validateList({ ...valid, expirationDate: 'invalid-date' });
    expect(out!.expirationDate).toBeUndefined();
  });

  it('keeps prerequisites on every list type', () => {
    for (const listType of ['workbench', 'project', 'quest', 'expedition'] as const) {
      const out = validateList({ ...valid, listType, prerequisites: ['a', 'b', 3] });
      expect(out!.prerequisites).toEqual(['a', 'b']);
    }
  });

  it('falls back to workbench for an unknown or missing listType', () => {
    expect(validateList({ ...valid, listType: 'bogus' })!.listType).toBe('workbench');
    expect(validateList({ ...valid })!.listType).toBe('workbench');
  });

  it('keeps the type-specific fields only on the matching list type', () => {
    const quest = validateList({ ...valid, listType: 'quest', trader: 'shani' });
    expect(quest!.listType === 'quest' && quest!.trader).toBe('shani');

    const project = validateList({ ...valid, listType: 'project', trader: 'shani', expeditionIndex: 4 });
    expect(project).not.toHaveProperty('trader');
    expect(project).not.toHaveProperty('expeditionIndex');

    // una spedizione senza indice valido riceve 1 (come il fallback della UI)
    const exp = validateList({ ...valid, listType: 'expedition', expeditionIndex: 'x' });
    expect(exp!.listType === 'expedition' && exp!.expeditionIndex).toBe(1);
  });

});

describe('validateProfile', () => {
  it('accepts a valid profile', () => {
    expect(validateProfile({ id: 'p1', name: 'Main' })).toEqual({ id: 'p1', name: 'Main' });
  });
  it('rejects missing fields', () => {
    expect(validateProfile({ id: 'p1' })).toBeNull();
    expect(validateProfile({ name: 'Main' })).toBeNull();
    expect(validateProfile(null)).toBeNull();
  });
});

// ── v schema builder (TDD — red first) ──────────────────────────────────────

describe('v.string()', () => {
  it('accepts a non-empty string', () => {
    expect(v.string().parse('hello', '')).toBe('hello');
  });
  it('rejects empty string → fallback', () => {
    expect(v.string().parse('', 'fb')).toBe('fb');
  });
  it('rejects non-strings → fallback', () => {
    expect(v.string().parse(42, 'fb')).toBe('fb');
    expect(v.string().parse(null, 'fb')).toBe('fb');
    expect(v.string().parse(undefined, 'fb')).toBe('fb');
  });
  it('.nullable() accepts null', () => {
    expect(v.string().nullable().parse(null, 'fb')).toBeNull();
    expect(v.string().nullable().parse('hi', null)).toBe('hi');
    expect(v.string().nullable().parse('', null)).toBeNull();
  });
  it('.optional() accepts undefined', () => {
    expect(v.string().optional().parse(undefined, 'fb')).toBeUndefined();
    expect(v.string().optional().parse('hi', undefined)).toBe('hi');
  });
});

describe('v.number()', () => {
  it('accepts a finite number and floors it', () => {
    expect(v.number().parse(3, 0)).toBe(3);
    expect(v.number().parse(2.9, 0)).toBe(2);
  });
  it('rejects NaN, Infinity, -Infinity → fallback', () => {
    expect(v.number().parse(NaN, -1)).toBe(-1);
    expect(v.number().parse(Infinity, -1)).toBe(-1);
    expect(v.number().parse(-Infinity, -1)).toBe(-1);
  });
  it('rejects non-numbers → fallback', () => {
    expect(v.number().parse('5', -1)).toBe(-1);
    expect(v.number().parse(null, -1)).toBe(-1);
  });
  it('min option rejects values below threshold', () => {
    expect(v.number({ min: 0 }).parse(-1, 0)).toBe(0);
    expect(v.number({ min: 1 }).parse(0, 1)).toBe(1);
    expect(v.number({ min: 1 }).parse(1, 0)).toBe(1);
  });
  it('.nullable() accepts null', () => {
    expect(v.number().nullable().parse(null, 0)).toBeNull();
  });
});

describe('v.boolean()', () => {
  it('accepts true and false', () => {
    expect(v.boolean().parse(true, false)).toBe(true);
    expect(v.boolean().parse(false, true)).toBe(false);
  });
  it('rejects truthy/falsy non-booleans → fallback', () => {
    expect(v.boolean().parse(1, false)).toBe(false);
    expect(v.boolean().parse(0, true)).toBe(true);
    expect(v.boolean().parse('true', false)).toBe(false);
    expect(v.boolean().parse(null, true)).toBe(true);
  });
  it('.nullable() accepts null', () => {
    expect(v.boolean().nullable().parse(null, false)).toBeNull();
  });
});

describe('v.literal()', () => {
  it('accepts the exact value', () => {
    expect(v.literal('dark').parse('dark', 'dark')).toBe('dark');
    expect(v.literal(42).parse(42, 42)).toBe(42);
  });
  it('rejects any other value → fallback', () => {
    expect(v.literal('dark').parse('light', 'dark')).toBe('dark');
    expect(v.literal('dark').parse(null, 'dark')).toBe('dark');
  });
});

describe('v.oneOf()', () => {
  const schema = v.oneOf(['asc', 'desc', 'name'] as const);

  it('accepts values in the set', () => {
    expect(schema.parse('asc', 'desc')).toBe('asc');
    expect(schema.parse('name', 'desc')).toBe('name');
  });
  it('rejects values not in the set → fallback', () => {
    expect(schema.parse('invalid', 'asc')).toBe('asc');
    expect(schema.parse(null, 'asc')).toBe('asc');
    expect(schema.parse(42, 'asc')).toBe('asc');
  });
});

describe('v.object()', () => {
  const schema = v.object({
    open: v.boolean(),
    count: v.number({ min: 0 }),
    label: v.string(),
  });

  it('accepts a fully valid object', () => {
    expect(schema.parse({ open: true, count: 3, label: 'hi' }, { open: false, count: 0, label: '' }))
      .toEqual({ open: true, count: 3, label: 'hi' });
  });
  it('falls back field-by-field (lenient: keeps valid fields)', () => {
    const fallback = { open: false, count: 0, label: 'fb' };
    const result = schema.parse({ open: true, count: 'bad', label: 'hi' }, fallback);
    expect(result.open).toBe(true);
    expect(result.count).toBe(0);   // field fallback
    expect(result.label).toBe('hi');
  });
  it('returns full fallback for non-objects', () => {
    const fallback = { open: false, count: 0, label: 'fb' };
    expect(schema.parse(null, fallback)).toEqual(fallback);
    expect(schema.parse('string', fallback)).toEqual(fallback);
    expect(schema.parse([], fallback)).toEqual(fallback);
  });
  it('ignores extra keys not in schema', () => {
    const result = schema.parse({ open: true, count: 1, label: 'x', extra: 999 }, { open: false, count: 0, label: '' });
    expect((result as Record<string, unknown>).extra).toBeUndefined();
  });
});

describe('v.array()', () => {
  const schema = v.array(v.number({ min: 0 }));

  it('filters out invalid elements, keeps valid ones', () => {
    expect(schema.parse([1, 'bad', -1, 2, NaN, 3], [])).toEqual([1, 2, 3]);
  });
  it('returns empty array for non-arrays → fallback', () => {
    expect(schema.parse(null, [])).toEqual([]);
    expect(schema.parse('x', [])).toEqual([]);
  });
  it('returns empty array for an all-invalid input', () => {
    expect(schema.parse(['a', 'b'], [])).toEqual([]);
  });
  it('works with string items', () => {
    const ss = v.array(v.string());
    expect(ss.parse(['a', '', 1, 'b'], [])).toEqual(['a', 'b']);
  });
});

describe('v.object() with nullable fields', () => {
  const schema = v.object({
    tag: v.string().nullable(),
    val: v.number().nullable(),
  });

  it('keeps null for nullable fields', () => {
    expect(schema.parse({ tag: null, val: null }, { tag: 'fb', val: 0 }))
      .toEqual({ tag: null, val: null });
  });
  it('falls back only invalid non-null values', () => {
    expect(schema.parse({ tag: 42, val: 'x' }, { tag: 'fb', val: 0 }))
      .toEqual({ tag: 'fb', val: 0 });
  });
});

describe('v — never throws', () => {
  it('parse never throws regardless of input', () => {
    const schema = v.object({ x: v.string() });
    expect(() => schema.parse(undefined, { x: '' })).not.toThrow();
    expect(() => schema.parse(Symbol('x'), { x: '' })).not.toThrow();
    expect(() => v.array(v.boolean()).parse({ 0: true }, [])).not.toThrow();
  });
});

describe('validateExpeditionIndex', () => {
  const existingExpeditions = [
    { id: 'expedition-1', name: 'Exp 1', maxLevel: 3, levels: [{ level: 1, requirementItemIds: [] }], listType: 'expedition' as const, expeditionIndex: 1 },
    { id: 'expedition-2', name: 'Exp 2', maxLevel: 3, levels: [{ level: 1, requirementItemIds: [] }], listType: 'expedition' as const, expeditionIndex: 2 },
  ];

  it('accepts next sequential index (3)', () => {
    const res = validateExpeditionIndex(3, 'expedition-3', existingExpeditions);
    expect(res.isValid).toBe(true);
    expect(res.error).toBeNull();
  });

  it('rejects duplicate index (2)', () => {
    const res = validateExpeditionIndex(2, 'expedition-new', existingExpeditions);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('già presente');
  });

  it('rejects non-contiguous index with gap (4 when 3 does not exist)', () => {
    const res = validateExpeditionIndex(4, 'expedition-new', existingExpeditions);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('indice 3 non esiste');
  });

  it('allows current expedition to keep its own index during edit', () => {
    const res = validateExpeditionIndex(2, 'expedition-2', existingExpeditions);
    expect(res.isValid).toBe(true);
    expect(res.error).toBeNull();
  });

  it('rejects index < 1 or non-integer', () => {
    expect(validateExpeditionIndex(0, 'exp-x', existingExpeditions).isValid).toBe(false);
    expect(validateExpeditionIndex(-1, 'exp-x', existingExpeditions).isValid).toBe(false);
    expect(validateExpeditionIndex(1.5, 'exp-x', existingExpeditions).isValid).toBe(false);
  });
});

describe('validateList: action context (maps and carry items)', () => {
  const withActions = (actions: unknown[], tieredActions?: unknown[]) => ({
    id: 'quest-1',
    name: 'Quest',
    maxLevel: 1,
    levels: [{ level: 1, requirementItemIds: [], actions, ...(tieredActions ? { tieredActions } : {}) }],
  });

  it('keeps valid maps (deduplicated) and carry items on actions', () => {
    const out = validateList(withActions([{
      id: 'a1',
      label: 'Do it',
      maps: ['buried-city', 'buried-city', '', 3],
      carryItems: [{ itemId: 'metal-parts', quantity: 2 }, { itemId: 'x' }, { quantity: 4 }, 'nope'],
    }]));
    const action = out!.levels[0].actions![0];
    expect(action.maps).toEqual(['buried-city']);
    expect(action.carryItems).toEqual([{ itemId: 'metal-parts', quantity: 2 }, { itemId: 'x', quantity: 1 }]);
  });

  it('omits empty context and keeps it on tiered steps', () => {
    const out = validateList(withActions(
      [{ id: 'a1', label: 'Do it', maps: [], carryItems: [] }],
      [{ id: 't1', label: 'Tiered', steps: [{ id: 's1', label: 'Step', maps: ['spaceport'] }] }],
    ));
    const level = out!.levels[0];
    expect('maps' in level.actions![0]).toBe(false);
    expect('carryItems' in level.actions![0]).toBe(false);
    expect(level.tieredActions![0].steps[0].maps).toEqual(['spaceport']);
  });
});

describe('validateList: Reward Pass', () => {
  const pass = (patch: Record<string, unknown> = {}) => ({
    id: 'frozen-trail',
    name: 'Frozen Trail',
    listType: 'pass',
    maxLevel: 2,
    tracks: [{ id: 'free', name: 'Free' }, { id: 'premium', name: 'Premium', translations: { it: { name: 'Premium IT' } } }],
    levels: [
      {
        level: 1,
        requirementItemIds: [],
        rewards: [
          { itemId: 'metal-parts', quantity: 2 },
          { itemId: 'xp-points', quantity: 100, track: 'premium' },
          { itemId: 'ghost', quantity: 1, track: 'unknown-track' },
        ],
      },
      { level: 2, requirementItemIds: [] },
    ],
    ...patch,
  });

  it('makes the track explicit (first one when missing) and drops rewards of undeclared tracks', () => {
    const out = validateList(pass());
    expect(out?.listType).toBe('pass');
    if (out?.listType !== 'pass') return;
    expect(out.tracks.map(t => t.id)).toEqual(['free', 'premium']);
    expect(out.tracks[1].translations?.it?.name).toBe('Premium IT');
    expect(out.levels[0].rewards).toEqual([
      { itemId: 'metal-parts', quantity: 2, track: 'free' },
      { itemId: 'xp-points', quantity: 100, track: 'premium' },
    ]);
  });

  it('drops duplicate or malformed tracks and falls back to the default ones when none is valid', () => {
    const dup = validateList(pass({ tracks: [{ id: 'free', name: 'A' }, { id: 'free', name: 'B' }, { name: 'no id' }] }));
    expect(dup?.listType === 'pass' && dup.tracks).toEqual([{ id: 'free', name: 'A' }]);
    const none = validateList(pass({ tracks: 'nope' }));
    expect(none?.listType === 'pass' && none.tracks.map(t => t.id)).toEqual(['free', 'premium']);
  });

  it('keeps the locked flag of a track only when it is true', () => {
    const out = validateList(pass({ tracks: [{ id: 'free', name: 'Free', locked: false }, { id: 'premium', name: 'Premium', locked: true }] }));
    expect(out?.listType === 'pass' && out.tracks.map(t => t.locked)).toEqual([undefined, true]);
  });

  it('reads the premium cost only when it is a valid number', () => {
    expect((validateList(pass({ premiumCostTokens: 1150 })) as { premiumCostTokens?: number }).premiumCostTokens).toBe(1150);
    expect('premiumCostTokens' in (validateList(pass({ premiumCostTokens: -5 })) as object)).toBe(false);
  });
});
