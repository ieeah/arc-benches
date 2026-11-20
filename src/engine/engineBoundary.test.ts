import ts from 'typescript';
import { describe, it, expect } from 'vitest';

const FORBIDDEN_IMPORT_PATTERNS = [
  /^react($|\/)/,
  /^react-dom($|\/)/,
  /^zustand($|\/)/,
  /^@\/store($|\/)/,
  /^@\/components($|\/)/,
  /^@\/pages($|\/)/,
  /^@\/i18n($|\/)/,
];

const FORBIDDEN_GLOBALS = new Set(['window', 'document', 'localStorage']);

const rawModules = import.meta.glob<string>('./*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const engineFiles = Object.entries(rawModules)
  .map(([relPath, sourceText]) => ({
    file: relPath.replace(/^\.\//, ''),
    sourceText,
  }))
  .filter(({ file }) => !file.endsWith('.test.ts'))
  .sort((a, b) => a.file.localeCompare(b.file));

function isPropertyOrTypeName(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return true;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
  if (ts.isPropertySignature(parent) && parent.name === node) return true;
  if (ts.isPropertyDeclaration(parent) && parent.name === node) return true;
  if (ts.isParameter(parent) && parent.name === node) return true;
  if (ts.isBindingElement(parent) && parent.name === node) return true;
  return false;
}

describe('Engine Architectural Boundary', () => {
  it('discovers all engine modules including index.ts', () => {
    const fileNames = engineFiles.map(entry => entry.file);
    expect(fileNames.length).toBeGreaterThan(0);
    expect(fileNames).toContain('index.ts');
  });

  it.each(engineFiles)('$file has zero interface declarations, forbidden imports, or browser globals', ({ file, sourceText }) => {
    const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);
    const violations: string[] = [];

    function visit(node: ts.Node) {
      if (ts.isInterfaceDeclaration(node)) {
        violations.push(`Uses forbidden 'interface ${node.name.text}' (use 'type' instead)`);
      }

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const spec = node.moduleSpecifier.text;
        if (FORBIDDEN_IMPORT_PATTERNS.some(pattern => pattern.test(spec))) {
          violations.push(`Forbidden import '${spec}'`);
        }
      }

      if (ts.isIdentifier(node) && FORBIDDEN_GLOBALS.has(node.text) && !isPropertyOrTypeName(node)) {
        violations.push(`Forbidden browser global '${node.text}'`);
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    expect(violations).toEqual([]);
  });
});
