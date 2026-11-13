import { describe, it, expect } from 'vitest';
import { computeJsonDiff } from './devDiff';

describe('computeJsonDiff', () => {
  it('detects no changes for identical objects', () => {
    const a = { name: 'Item', count: 10 };
    const b = { count: 10, name: 'Item' };
    const res = computeJsonDiff(a, b);
    expect(res.hasChanges).toBe(false);
    expect(res.summary.added).toBe(0);
    expect(res.summary.removed).toBe(0);
    expect(res.summary.changed).toBe(0);
  });

  it('detects additions in modified object', () => {
    const a = { name: 'Item' };
    const b = { name: 'Item', extra: 'new-field' };
    const res = computeJsonDiff(a, b);
    expect(res.hasChanges).toBe(true);
    expect(res.summary.added).toBe(1);
    expect(res.diffLines.some(l => l.type === 'add' && l.text.includes('extra'))).toBe(true);
  });

  it('detects removals in modified object', () => {
    const a = { name: 'Item', obsolete: true };
    const b = { name: 'Item' };
    const res = computeJsonDiff(a, b);
    expect(res.hasChanges).toBe(true);
    expect(res.summary.removed).toBe(1);
    expect(res.diffLines.some(l => l.type === 'remove' && l.text.includes('obsolete'))).toBe(true);
  });

  it('detects modifications of existing values', () => {
    const a = { name: 'Item', count: 1 };
    const b = { name: 'Item', count: 5 };
    const res = computeJsonDiff(a, b);
    expect(res.hasChanges).toBe(true);
    expect(res.summary.changed).toBe(1);
    expect(res.diffLines.some(l => l.type === 'change' && l.text.includes('count'))).toBe(true);
  });

  it('handles strings, arrays and nested structures', () => {
    const a = { tags: ['a', 'b'], nested: { x: 1 } };
    const b = { tags: ['a', 'c'], nested: { x: 2 } };
    const res = computeJsonDiff(a, b);
    expect(res.hasChanges).toBe(true);
  });
});
