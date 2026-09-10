import { describe, it, expect } from 'vitest';
import { buildNavTree, flattenNavLeaves, type NavConfig } from '@/lib/navTree';

const identity = (k: string) => k;

const config: NavConfig = {
  tree: [
    { id: 'stash', labelKey: 'nav.stash', icon: 'backpack' },
    { id: 'secret', label: 'Secret', icon: 'x', visibility: 'dev' },
    {
      id: 'tools', labelKey: 'nav.tools', icon: 'wrench', category: true,
      children: [
        { id: 'items', label: 'Catalog', icon: 'database' },
        { id: 'dev-lab', label: 'Dev Lab', icon: 'flask-conical', visibility: 'dev' },
      ],
    },
    {
      id: 'emptyCat', label: 'Empty', icon: 'x', category: true,
      children: [{ id: 'onlyDev', label: 'x', icon: 'x', visibility: 'dev' }],
    },
  ],
};

describe('buildNavTree', () => {
  it('resolves labelKey via t() when no literal label is set', () => {
    const t = (k: string) => (k === 'nav.stash' ? 'Stash!' : k);
    const tree = buildNavTree(config, { isDev: true, t });
    expect(tree.find(i => i.id === 'stash')!.label).toBe('Stash!');
    expect(tree.find(i => i.id === 'tools')!.children!.find(c => c.id === 'items')!.label).toBe('Catalog');
  });

  it('a literal label overrides labelKey when both are set', () => {
    const withBoth: NavConfig = { tree: [{ id: 'x', labelKey: 'nav.stash', label: 'Forced', icon: 'x' }] };
    const t = () => 'Translated';
    expect(buildNavTree(withBoth, { isDev: true, t })[0].label).toBe('Forced');
  });

  it('shows the raw key when labelKey is unresolved and no label is set', () => {
    const unresolved: NavConfig = { tree: [{ id: 'x', labelKey: 'nav.missing', icon: 'x' }] };
    expect(buildNavTree(unresolved, { isDev: true, t: identity })[0].label).toBe('nav.missing');
  });

  it('hides visibility:dev entries when not in dev', () => {
    const prod = buildNavTree(config, { isDev: false, t: identity }).map(i => i.id);
    expect(prod).not.toContain('secret');
    const toolsChildren = buildNavTree(config, { isDev: false, t: identity })
      .find(i => i.id === 'tools')!.children!.map(c => c.id);
    expect(toolsChildren).toEqual(['items']);
  });

  it('shows dev entries in dev', () => {
    const dev = buildNavTree(config, { isDev: true, t: identity }).map(i => i.id);
    expect(dev).toContain('secret');
  });

  it('collapses a category whose children are all hidden', () => {
    const prod = buildNavTree(config, { isDev: false, t: identity }).map(i => i.id);
    expect(prod).not.toContain('emptyCat');
  });

  it('marks dev-gated leaves with devOnly', () => {
    const dev = buildNavTree(config, { isDev: true, t: identity });
    expect(dev.find(i => i.id === 'secret')!.devOnly).toBe(true);
    expect(dev.find(i => i.id === 'stash')!.devOnly).toBeUndefined();
  });
});

describe('flattenNavLeaves', () => {
  it('drops categories, keeps leaves', () => {
    const tree = buildNavTree(config, { isDev: true, t: identity });
    const ids = flattenNavLeaves(tree).map(i => i.id);
    expect(ids).toContain('items');
    expect(ids).toContain('dev-lab');
    expect(ids).not.toContain('tools');
  });
});
