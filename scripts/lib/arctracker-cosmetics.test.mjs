import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadCosmeticsPages, mergeLanguages, parseCosmeticsPage, passSources } from './arctracker-cosmetics.mjs';

/** Pagina minima con il payload nel formato incorporato da Next.js. */
const pageWith = (objects) => {
  const payload = `0:["$","div",null,{"cosmetics":${JSON.stringify(objects)}}]`;
  return `<html><body><script>self.__next_f.push([1,${JSON.stringify(payload)}])</script></body></html>`;
};

const cosmetic = (n, extra = {}) => ({ id: `outfit-${n}`, kind: 'outfit', name: `Nome ${n}`, picture: true, addedIn: '2.0', release: 'released', sources: [], settings: [], ...extra });
const many = (count) => Array.from({ length: count }, (_, i) => cosmetic(i));

describe('parseCosmeticsPage', () => {
  it('extracts the cosmetics embedded in the page payload', () => {
    const list = parseCosmeticsPage(pageWith(many(120)));
    expect(list).toHaveLength(120);
    expect(list[5]).toMatchObject({ id: 'outfit-5', kind: 'outfit' });
  });

  it('handles braces and quotes inside names', () => {
    const list = parseCosmeticsPage(pageWith([cosmetic(0, { name: 'Con {graffe} e "virgolette"' }), ...many(120).slice(1)]));
    expect(list[0].name).toBe('Con {graffe} e "virgolette"');
  });

  it('fails clearly when the payload is missing or has an unexpected shape', () => {
    expect(() => parseCosmeticsPage('<html></html>')).toThrow(/formato della pagina cambiato/);
    expect(() => parseCosmeticsPage(pageWith(many(10)))).toThrow(/formato cambiato/);
  });
});

describe('mergeLanguages / passSources', () => {
  const itList = [cosmetic(1, {
    sources: [{ type: 'raider-deck', deck: 'frozen-trail-reward-pass', level: 1 }, { type: 'store' }],
    settings: [{ key: 'bag', name: 'Borsa', options: [{ key: 'on', name: 'Sì', base: false, sources: [{ type: 'raider-deck', deck: 'legacy-pass', level: 3 }] }] }],
  })];
  const enList = [{ ...itList[0], name: 'Name 1', settings: [{ key: 'bag', name: 'Bag', options: [{ key: 'on', name: 'Yes', sources: [] }] }] }];

  it('joins the Italian and English names, also for settings and options', () => {
    const [merged] = mergeLanguages({ it: itList, en: enList });
    expect(merged.names).toEqual({ it: 'Nome 1', en: 'Name 1' });
    expect(merged.settings[0].names).toEqual({ it: 'Borsa', en: 'Bag' });
    expect(merged.settings[0].options[0].names).toEqual({ it: 'Sì', en: 'Yes' });
  });

  it('collects the pass entries of a deck, including the ones on options', () => {
    const [merged] = mergeLanguages({ it: itList, en: enList });
    expect(passSources(merged, 'frozen-trail-reward-pass')).toEqual([{ type: 'raider-deck', deck: 'frozen-trail-reward-pass', level: 1 }]);
    expect(passSources(merged, 'legacy-pass')).toMatchObject([{ level: 3, setting: 'bag', option: 'on' }]);
  });
});

describe('loadCosmeticsPages', () => {
  it('downloads the Italian and English pages once and caches them; nothing is written on failure', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cosmetics-'));
    const cachePath = join(dir, 'raw.json');
    const failing = vi.fn(async (url) => (url.includes('/en/') ? { ok: false, status: 500 } : { ok: true, status: 200, text: async () => pageWith(many(120)) }));
    await expect(loadCosmeticsPages({ cachePath, fetchImpl: failing, log: () => {} })).rejects.toThrow(/500/);
    expect(existsSync(cachePath)).toBe(false);

    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, text: async () => pageWith(many(120)) }));
    const data = await loadCosmeticsPages({ cachePath, fetchImpl, log: () => {} });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][1].headers['User-Agent']).toMatch(/ARCBenchesCompanion/);
    expect(Object.keys(data.pages)).toEqual(['it', 'en']);
    await loadCosmeticsPages({ cachePath, fetchImpl, log: () => {} });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    rmSync(dir, { recursive: true, force: true });
  });
});
