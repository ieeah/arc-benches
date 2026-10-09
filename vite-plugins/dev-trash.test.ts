import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TRASH_FILE, addTrashEntry, clearTrash, readTrash, removeTrashEntry } from './dev-trash';

let root: string;

const entry = (id: string) => ({ id, kind: 'pass-track', label: `Traccia ${id}`, deletedAt: '2026-10-09T12:00:00Z', payload: { listId: 'p', track: { id, name: id } } });

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-trash-'));
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe('dev trash', () => {
  it('is empty when the file does not exist or is corrupt', () => {
    expect(readTrash(root)).toEqual([]);
    fs.mkdirSync(path.join(root, 'dev-trash'));
    fs.writeFileSync(path.join(root, TRASH_FILE), '{ not json');
    expect(readTrash(root)).toEqual([]);
  });

  it('adds entries newest first, creating the folder, and replaces an entry with the same id', () => {
    addTrashEntry(root, entry('a'));
    addTrashEntry(root, entry('b'));
    expect(readTrash(root).map((e) => e.id)).toEqual(['b', 'a']);
    addTrashEntry(root, { ...entry('a'), label: 'aggiornata' });
    expect(readTrash(root).map((e) => e.id)).toEqual(['a', 'b']);
    expect(readTrash(root)[0].label).toBe('aggiornata');
  });

  it('rejects malformed entries without touching the file', () => {
    expect(addTrashEntry(root, { id: 'x' }).ok).toBe(false);
    expect(addTrashEntry(root, null).ok).toBe(false);
    expect(fs.existsSync(path.join(root, TRASH_FILE))).toBe(false);
  });

  it('removes an entry by id', () => {
    addTrashEntry(root, entry('a'));
    addTrashEntry(root, entry('b'));
    const result = removeTrashEntry(root, 'a');
    expect(result.ok && result.entries.map((e) => e.id)).toEqual(['b']);
    expect(removeTrashEntry(root, 42).ok).toBe(false);
  });

  it('empties the whole trash', () => {
    addTrashEntry(root, entry('a'));
    addTrashEntry(root, entry('b'));
    expect(clearTrash(root)).toEqual({ ok: true, entries: [] });
    expect(readTrash(root)).toEqual([]);
  });
});
