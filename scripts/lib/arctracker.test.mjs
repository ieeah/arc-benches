import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  cleanText, extractList, loadArcTracker, normalizeId, normalizeItem, normalizeLocalized, validateResponse,
} from './arctracker.mjs';
import { buildMissingItemsReport } from './arctracker-report.mjs';

describe('normalizeId', () => {
  it('turns snake_case ids into hyphen-case', () => {
    expect(normalizeId('acoustic_guitar')).toBe('acoustic-guitar');
    expect(normalizeId(' Metal_Parts ')).toBe('metal-parts');
  });
});

describe('cleanText', () => {
  it('replaces the broken replacement character with an apostrophe and tidies spaces', () => {
    expect(cleanText('Mountaineer�s Detector')).toBe("Mountaineer's Detector");
    expect(cleanText('  Chitarra   acustica ')).toBe('Chitarra acustica');
  });

  it('leaves non strings alone', () => {
    expect(cleanText(null)).toBeNull();
    expect(cleanText(5)).toBe(5);
  });
});

describe('normalizeLocalized', () => {
  it('cleans each language and drops empty or non string entries', () => {
    expect(normalizeLocalized({ en: 'A�b', it: ' Ciao ', de: '', fr: 3 })).toEqual({ en: "A'b", it: 'Ciao' });
    expect(normalizeLocalized(undefined)).toEqual({});
  });
});

describe('extractList / validateResponse', () => {
  it('reads arrays and id-indexed objects (quests)', () => {
    expect(extractList('items', { items: [{ id: 'a' }] })).toEqual([{ id: 'a' }]);
    expect(extractList('quests', { quests: { q1: { id: 'q1' }, q2: { id: 'q2' } } })).toHaveLength(2);
  });

  it('fails clearly when the list key is missing, the list is empty or required fields disappeared', () => {
    expect(() => extractList('items', { data: [] })).toThrow(/schema cambiato/);
    expect(() => validateResponse('items', { items: [] })).toThrow(/vuoto/);
    expect(() => validateResponse('items', { items: [{ id: 'a' }, { id: 'b' }] })).toThrow(/"name"/);
  });

  it('tolerates a few incomplete entries', () => {
    const items = [{ id: 'a', name: {}, type: 'x' }, { id: 'b', name: {}, type: 'x' }, { id: 'c' }];
    expect(validateResponse('items', { items })).toHaveLength(3);
  });
});

describe('normalizeItem', () => {
  it('keeps the original id and the data, with normalized id and texts', () => {
    const item = normalizeItem({ id: 'acoustic_guitar', name: { en: 'Guitar', it: 'Chitarra' }, type: 'Quick Use', rarity: 'Rare', value: 7000, stackSize: 1, imageFilename: 'https://x/y.png' });
    expect(item).toMatchObject({ id: 'acoustic-guitar', rawId: 'acoustic_guitar', type: 'Quick Use', value: 7000, imageUrl: 'https://x/y.png' });
    expect(item.names.it).toBe('Chitarra');
  });
});

describe('loadArcTracker', () => {
  const okResponse = (endpoint) => {
    const bodies = {
      items: { items: [{ id: 'a', name: {}, type: 't' }] },
      quests: { quests: { q: { id: 'q', name: {} } } },
      hideout: { hideoutModules: [{ id: 'h', name: {}, levels: [] }] },
      projects: { projects: [{ id: 'p', name: {} }] },
    };
    return { ok: true, status: 200, json: async () => bodies[endpoint] };
  };

  it('downloads the four endpoints once, sends the User-Agent and writes the cache', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'arctracker-'));
    const cachePath = join(dir, 'raw.json');
    const fetchImpl = vi.fn(async (url) => okResponse(url.split('/api/')[1]));
    const data = await loadArcTracker({ cachePath, fetchImpl, log: () => {} });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(fetchImpl.mock.calls[0][1].headers['User-Agent']).toMatch(/ARCBenchesCompanion/);
    expect(Object.keys(data)).toEqual(expect.arrayContaining(['fetchedAt', 'items', 'quests', 'hideout', 'projects']));
    expect(JSON.parse(readFileSync(cachePath, 'utf-8')).items.items).toHaveLength(1);
    rmSync(dir, { recursive: true, force: true });
  });

  it('uses the cache without fetching, unless refresh is requested', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'arctracker-'));
    const cachePath = join(dir, 'raw.json');
    writeFileSync(cachePath, JSON.stringify({ fetchedAt: 'ieri', items: {} }));
    const fetchImpl = vi.fn();
    expect((await loadArcTracker({ cachePath, fetchImpl, log: () => {} })).fetchedAt).toBe('ieri');
    expect(fetchImpl).not.toHaveBeenCalled();
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes nothing when an endpoint fails or has a changed schema', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'arctracker-'));
    const cachePath = join(dir, 'raw.json');
    const failing = vi.fn(async (url) => (url.endsWith('/quests') ? { ok: false, status: 503 } : okResponse(url.split('/api/')[1])));
    await expect(loadArcTracker({ cachePath, fetchImpl: failing, log: () => {} })).rejects.toThrow(/503/);
    const changed = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ unexpected: true }) }));
    await expect(loadArcTracker({ cachePath, fetchImpl: changed, log: () => {} })).rejects.toThrow(/schema cambiato/);
    expect(existsSync(cachePath)).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('buildMissingItemsReport', () => {
  const theirs = [
    normalizeItem({ id: 'metal_parts', name: { en: 'Metal Parts', it: 'Parti metalliche' }, type: 'Basic Material', rarity: 'Common', value: '75', stackSize: 50 }),
    normalizeItem({ id: 'new_thing', name: { en: 'New Thing', it: 'Cosa nuova' }, type: 'Cosmetic', rarity: 'Rare', value: 10 }),
    normalizeItem({ id: 'rope', name: { en: 'Rope', it: 'Corda' }, type: 'Material', rarity: 'rare', value: 5, stackSize: 10 }),
  ];
  const ours = {
    'metal-parts': { item_type: 'Basic Material', rarity: 'Common', value: 75, stack_size: 100, translations: {} },
    rope: { item_type: 'Material', rarity: 'Rare', value: 5, stack_size: 10 },
    'our-outfit': { item_type: 'Outfits', rarity: 'Epic', value: null, stack_size: null },
  };

  it('separates the items only they have, only we have and the common ones', () => {
    const report = buildMissingItemsReport({ theirs, ours, source: {} });
    expect(report.onlyArcTracker.map((i) => i.id)).toEqual(['new-thing']);
    expect(report.onlyOurs).toEqual(['our-outfit']);
    expect(report.summary).toMatchObject({ theirs: 3, ours: 3, common: 2, onlyTheirs: 1, onlyOurs: 1 });
    expect(report.summary.onlyTheirsByType).toEqual({ Cosmetic: 1 });
  });

  it('reports field differences ignoring case, string vs number and empty values', () => {
    const report = buildMissingItemsReport({ theirs, ours, source: {} });
    expect(report.fieldDiffs).toEqual([{ id: 'metal-parts', field: 'stack_size', ours: 100, theirs: 50 }]);
  });

  it('lists the common items whose Italian name we lack', () => {
    const report = buildMissingItemsReport({ theirs, ours, source: {} });
    expect(report.italianNameFillable).toEqual(['metal-parts', 'rope']);
  });
});
