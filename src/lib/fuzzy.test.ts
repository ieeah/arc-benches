import { describe, it, expect } from 'vitest';
import { fuzzyMatch } from './fuzzy';

describe('fuzzyMatch', () => {
  it('matches everything on an empty or blank query', () => {
    expect(fuzzyMatch('Anything', '')).toBe(true);
    expect(fuzzyMatch('Anything', '   ')).toBe(true);
  });

  it('matches the characters of a single word in order inside one word of the text', () => {
    expect(fuzzyMatch('Industrial Magnet', 'magnet')).toBe(true);
    expect(fuzzyMatch('Magnetron', 'mgnt')).toBe(true);
    expect(fuzzyMatch('Manganello rovinato', 'magnet')).toBe(false);
    expect(fuzzyMatch('Già scaduto', 'gia')).toBe(true);
  });

  it('splits the text on hyphens as well as spaces', () => {
    expect(fuzzyMatch('metal-parts', 'parts')).toBe(true);
  });

  it('requires every word of a multi-word query to match, in any order', () => {
    expect(fuzzyMatch('Battered Paperback', 'battered paper')).toBe(true);
    expect(fuzzyMatch('Battered Paperback', 'paper battered')).toBe(true);
    expect(fuzzyMatch('Battered Paperback', 'battered')).toBe(true);
    expect(fuzzyMatch('Battered Paperback', 'battered magnet')).toBe(false);
    expect(fuzzyMatch('Industrial Magnet', 'ind mag')).toBe(true);
  });

  it('ignores extra spaces and hyphens in the query', () => {
    expect(fuzzyMatch('Battered Paperback', '  battered   paper ')).toBe(true);
    expect(fuzzyMatch('Battered Paperback', 'battered-paper')).toBe(true);
  });
});
