import { describe, it, expect } from 'vitest';
import { categoryToKind, matchCosmetic, nameScore, parseLegacyMarkdown } from './legacy-matcher.mjs';

describe('parseLegacyMarkdown', () => {
  it('reads the rows of the table and skips header and separator', () => {
    const md = `| Livello | Oggetto | Dettagli |
| ------- | ------- | -------- |
| 1       | Pilota  | outfit   |
| 4       | 50 raider tokens |  |
| 44      | pilota  | toggles + colore |
`;
    expect(parseLegacyMarkdown(md)).toEqual([
      { level: 1, name: 'Pilota', category: 'outfit' },
      { level: 4, name: '50 raider tokens', category: '' },
      { level: 44, name: 'pilota', category: 'toggles + colore' },
    ]);
  });
});

describe('categoryToKind', () => {
  it('maps the Italian categories of the table to reward kinds', () => {
    expect(categoryToKind('outfit').kind).toBe('outfit');
    expect(categoryToKind('accessorio zaino').kind).toBe('backpack-attachment');
    expect(categoryToKind('charm per zaino').kind).toBe('backpack-charm');
    expect(categoryToKind('zaino').kind).toBe('backpack');
    expect(categoryToKind('stile del volto').kind).toBe('face-style');
    expect(categoryToKind('stile volto').kind).toBe('face-style');
    expect(categoryToKind('volto').kind).toBe('face');
    expect(categoryToKind('capelli').kind).toBe('hair');
    expect(categoryToKind('peluria').kind).toBe('facial-hair');
    expect(categoryToKind('strumento raider').kind).toBe('raider-tool');
    expect(categoryToKind('emote').kind).toBe('emote');
    expect(categoryToKind('').kind).toBe('item');
    expect(categoryToKind('qualcosa di nuovo').kind).toBe('unknown');
  });

  it('recognizes the Scrappy outfits and the pieces of an outfit', () => {
    expect(categoryToKind('outfit (per scrappy)').kind).toBe('scrappy-outfit');
    expect(categoryToKind('toggles')).toEqual({ kind: 'outfit-piece', pieces: ['toggles'] });
    expect(categoryToKind('colore')).toEqual({ kind: 'outfit-piece', pieces: ['colors'] });
    expect(categoryToKind('toggles + colore')).toEqual({ kind: 'outfit-piece', pieces: ['toggles', 'colors'] });
  });
});

describe('nameScore', () => {
  it('ignores case, accents, stopwords and a single typo', () => {
    expect(nameScore('tanica carburante', 'Tanica di carburante')).toBeGreaterThan(0.9);
    expect(nameScore("specialista d'archeologia", 'Specialista di archeologia')).toBeGreaterThan(0.9);
    expect(nameScore('mullett', 'Mullet')).toBeGreaterThan(0.5);
    expect(nameScore('pilota', 'Portiere')).toBe(0);
  });

  it('gives a partial score when the written name is only part of the real one', () => {
    const score = nameScore('cerotto', 'Cerotto sulla guancia');
    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeLessThan(1);
  });
});

describe('matchCosmetic', () => {
  const cosmetic = (id, it, en) => ({ id, names: { it, en } });
  const candidates = [cosmetic('c1', 'Cerotto sulla guancia', 'Bandaid Cheek'), cosmetic('c2', 'Cerotto sul sopracciglio', 'Eyebrow Bandaid'), cosmetic('c3', 'Mullet', 'Mullet')];

  it('matches by name, preferring the cosmetics the site lists at that level', () => {
    expect(matchCosmetic('cerotto', candidates, new Set(['c1']))).toMatchObject({ cosmetic: { id: 'c1' }, method: 'name+level' });
    expect(matchCosmetic('mullett', candidates)).toMatchObject({ cosmetic: { id: 'c3' }, method: 'name' });
  });

  it('falls back to the only cosmetic listed at that level, flagging that the name differs', () => {
    const result = matchCosmetic('pilota', [cosmetic('a', 'Portiere', 'Goalie'), cosmetic('b', 'Pilota', 'Ryder')], new Set(['a']));
    expect(result).toMatchObject({ cosmetic: { id: 'a' }, method: 'level-only' });
    expect(result.score).toBeLessThan(0.5);
  });

  it('returns null when nothing is close enough', () => {
    expect(matchCosmetic('xyz', candidates)).toBeNull();
  });
});
