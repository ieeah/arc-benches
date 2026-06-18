import type { List, ListExportFile } from '../types';

export function buildExport(
  lists: List[],
  hideoutLevels: Record<string, number>,
  targetLevels: Record<string, number>,
  activeModules: Record<string, boolean>,
): ListExportFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    lists: lists
      .filter(l => l.custom)
      .map(list => ({
        list,
        currentLevel: hideoutLevels[list.id] ?? 0,
        targetLevel: targetLevels[list.id] ?? list.maxLevel,
        active: activeModules[list.id] ?? true,
      })),
  };
}

export function downloadExport(data: ListExportFile): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arc-lists-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImport(json: string): ListExportFile {
  const data = JSON.parse(json) as Record<string, unknown>;
  if (data.version !== 1 || !Array.isArray(data.lists)) throw new Error('Formato file non valido');
  for (const entry of data.lists as Record<string, unknown>[]) {
    const list = entry.list as Record<string, unknown> | undefined;
    if (!list?.custom || typeof list.id !== 'string' || !list.id.startsWith('custom:')) {
      throw new Error('Il file contiene liste non valide');
    }
  }
  return data as unknown as ListExportFile;
}
