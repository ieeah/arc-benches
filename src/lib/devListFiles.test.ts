import { describe, it, expect } from 'vitest';
import type { List, ListType } from '@/types';
import { listFilesToApply } from './devListFiles';
import { isListStillInFile } from './devTrash';

const list = (id: string, listType: ListType): List =>
  ({ id, name: id, listType, maxLevel: 1, levels: [{ level: 1, requirementItemIds: [] }] }) as List;

const data = (over: Partial<Record<ListType, List[]>> = {}): Record<ListType, List[]> => ({
  workbench: [list('bench', 'workbench')],
  expedition: [],
  project: [list('p1', 'project'), list('p2', 'project')],
  quest: [],
  pass: [],
  custom: [],
  ...over,
});

describe('listFilesToApply', () => {
  it('points to the file with the deletion even when the selection fell back to a bench', () => {
    const initial = data();
    const afterDelete = data({ project: [list('p1', 'project')] }); // p2 eliminata dalla bozza
    expect(listFilesToApply(afterDelete, initial, 'workbench')).toEqual({ modified: ['project'], target: 'project' });
  });

  it('keeps the selected type as target when it has changes, and lists every modified file', () => {
    const initial = data();
    const changed = data({ project: [], workbench: [] });
    const result = listFilesToApply(changed, initial, 'workbench');
    expect(result.modified.sort()).toEqual(['project', 'workbench']);
    expect(result.target).toBe('workbench');
  });

  it('with no changes the target is the selected type', () => {
    expect(listFilesToApply(data(), data(), 'project')).toEqual({ modified: [], target: 'project' });
  });

  it('ignores the custom bucket, which has no file', () => {
    const changed = data({ custom: [list('mine', 'custom')] });
    expect(listFilesToApply(changed, data(), 'project')).toEqual({ modified: [], target: 'project' });
  });
});

describe('isListStillInFile', () => {
  it('is true while the deleted list is still in the file of its type, false after it is written', () => {
    const p2 = list('p2', 'project');
    expect(isListStillInFile(p2, { project: [list('p1', 'project'), p2] })).toBe(true);
    expect(isListStillInFile(p2, { project: [list('p1', 'project')] })).toBe(false);
    expect(isListStillInFile(p2, {})).toBe(false);
    expect(isListStillInFile(p2, { workbench: [list('p2', 'workbench')] })).toBe(false);
  });
});
