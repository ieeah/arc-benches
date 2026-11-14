import { describe, it, expect } from 'vitest';
import { PageLayout, PAGE_LAYOUT_WIDTH_CLASSES, type PageLayoutWidth } from './PageLayout';

describe('PageLayout component and utilities', () => {
  it('exports PageLayout as a React component function', () => {
    expect(typeof PageLayout).toBe('function');
  });

  it('provides standard content width classes matching mobile-first specifications', () => {
    expect(PAGE_LAYOUT_WIDTH_CLASSES.default).toBe('max-w-md md:max-w-3xl');
    expect(PAGE_LAYOUT_WIDTH_CLASSES.wide).toBe('max-w-5xl');
    expect(PAGE_LAYOUT_WIDTH_CLASSES.full).toBe('w-full');
  });

  it('validates PageLayoutWidth keys', () => {
    const validKeys: PageLayoutWidth[] = ['default', 'wide', 'full'];
    expect(Object.keys(PAGE_LAYOUT_WIDTH_CLASSES).sort()).toEqual(validKeys.sort());
  });
});
