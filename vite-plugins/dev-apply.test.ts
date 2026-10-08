import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APPLY_ALLOWED_FILES, applyFiles } from './dev-apply';

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-apply-'));
  fs.mkdirSync(path.join(root, 'src/data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/i18n/locales'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/data/nav.json'), '{\n  "tree": []\n}\n');
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe('applyFiles', () => {
  it('writes an allowed file whose disk content matches the baseline', () => {
    const result = applyFiles(root, [
      { path: 'src/data/nav.json', content: '{\n  "tree": [1]\n}\n', baseline: JSON.stringify({ tree: [] }) },
    ]);
    expect(result).toEqual({ status: 'ok', written: ['src/data/nav.json'] });
    expect(fs.readFileSync(path.join(root, 'src/data/nav.json'), 'utf-8')).toBe('{\n  "tree": [1]\n}\n');
  });

  it('rejects paths outside the allow-list, including traversal attempts', () => {
    for (const bad of ['package.json', '../outside.json', 'src/data/../../package.json', 'src/data/other.json']) {
      expect(applyFiles(root, [{ path: bad, content: '{}' }]).status).toBe('error');
    }
    expect(fs.existsSync(path.join(root, 'package.json'))).toBe(false);
  });

  it('reports a conflict instead of overwriting a file changed on disk', () => {
    const result = applyFiles(root, [
      { path: 'src/data/nav.json', content: '{"tree":[1]}', baseline: JSON.stringify({ tree: ['edited-by-hand'] }) },
    ]);
    expect(result).toEqual({ status: 'conflict', conflicts: ['src/data/nav.json'] });
    expect(fs.readFileSync(path.join(root, 'src/data/nav.json'), 'utf-8')).toContain('"tree": []');
  });

  it('overwrites despite a conflict when forced', () => {
    const result = applyFiles(
      root,
      [{ path: 'src/data/nav.json', content: '{"tree":[1]}', baseline: JSON.stringify({ tree: ['x'] }) }],
      true,
    );
    expect(result.status).toBe('ok');
  });

  it('writes nothing at all when one of the files conflicts', () => {
    fs.writeFileSync(path.join(root, 'src/data/feature-flags.json'), '{"vault":false}\n');
    const result = applyFiles(root, [
      { path: 'src/data/feature-flags.json', content: '{"vault":true}\n', baseline: JSON.stringify({ vault: false }) },
      { path: 'src/data/nav.json', content: '{}', baseline: JSON.stringify({ tree: ['x'] }) },
    ]);
    expect(result.status).toBe('conflict');
    expect(fs.readFileSync(path.join(root, 'src/data/feature-flags.json'), 'utf-8')).toBe('{"vault":false}\n');
  });

  it('compares .ts files as text, ignoring line-ending differences', () => {
    fs.writeFileSync(path.join(root, 'src/i18n/locales/it.ts'), 'export const it = {};\r\n');
    const result = applyFiles(root, [
      { path: 'src/i18n/locales/it.ts', content: 'export const it = { a: 1 };\n', baseline: 'export const it = {};\n' },
    ]);
    expect(result.status).toBe('ok');
  });

  it('rejects empty requests', () => {
    expect(applyFiles(root, []).status).toBe('error');
  });
});

describe('allow-list', () => {
  it('covers every repo path declared in devArtifacts', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../src/lib/devArtifacts.ts'), 'utf-8');
    const declared = [...source.matchAll(/'(src\/data\/[^']+)'/g)].map((m) => m[1]);
    expect(declared.length).toBeGreaterThan(0);
    for (const file of declared) expect(APPLY_ALLOWED_FILES as readonly string[]).toContain(file);
    // le traduzioni sono costruite con un template literal: devono comunque essere ammesse
    expect(APPLY_ALLOWED_FILES).toContain('src/i18n/locales/it.ts');
    expect(APPLY_ALLOWED_FILES).toContain('src/i18n/locales/en.ts');
  });
});
