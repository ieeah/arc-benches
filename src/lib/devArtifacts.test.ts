import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildListsFileContent, getDevArtifacts } from './devArtifacts';
import { DRAFT_STORAGE_KEY, getInitialData } from '@/hooks/dev/useDevListDrafts';
import { resetFeatureFlags } from './featureFlags';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

const storage = new MockStorage();
vi.stubGlobal('localStorage', storage);

const byId = (id: string) => getDevArtifacts().find(a => a.id === id)!;

describe('dev artifacts', () => {
  beforeEach(() => {
    storage.clear();
    resetFeatureFlags();
  });

  it('reports nothing as modified when there are no drafts', () => {
    expect(getDevArtifacts().filter(a => a.isModified())).toEqual([]);
  });

  it('keeps the workbenches file shape (metadata + items) instead of { lists }', () => {
    const parsed = JSON.parse(buildListsFileContent('workbench', getInitialData().workbench.slice(0, 2)));
    expect(parsed.items).toHaveLength(2);
    expect(parsed).toMatchObject({ type: 'workbench', total: 2, count: 2 });
    expect(parsed).not.toHaveProperty('lists');
  });

  it('uses { lists } for the other list files and ends with a newline', () => {
    const out = buildListsFileContent('project', []);
    expect(JSON.parse(out)).toEqual({ lists: [] });
    expect(out.endsWith('}\n')).toBe(true);
  });

  it('flags only the edited list file as modified, and reset restores it', () => {
    const initial = getInitialData();
    const draft = { ...initial, project: initial.project.slice(1) };
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

    expect(getDevArtifacts().filter(a => a.isModified()).map(a => a.id)).toEqual(['lists-project']);

    byId('lists-project').reset();
    expect(getDevArtifacts().filter(a => a.isModified())).toEqual([]);
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('detects an overrides draft and rebuilds the file from it', () => {
    storage.setItem('dev_items_overrides_draft', JSON.stringify({ 'metal-parts': { hidden: true } }));
    const art = byId('items-overrides');
    expect(art.isModified()).toBe(true);
    expect(JSON.parse(art.build())).toEqual({ 'metal-parts': { hidden: true } });
    art.reset();
    expect(art.isModified()).toBe(false);
  });

  it('builds the locale source files from the effective dictionaries', () => {
    expect(byId('locale-it').build()).toContain('export const it =');
    expect(byId('locale-en').build()).toContain('export const en: LocaleSchema =');
  });
});
