import type { List, ListExportEntry, ListExportFile } from '../types';

export function buildExport(
  lists: List[],
  hideoutLevels: Record<string, number>,
  targetLevels: Record<string, number[]>,
  activeModules: Record<string, boolean>,
  inventory: Record<string, number>,
): ListExportFile {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    lists: lists.map(list => ({
        list,
        currentLevel: hideoutLevels[list.id] ?? 0,
        targetLevels: targetLevels[list.id] ?? list.levels.map(l => l.level),
        active: activeModules[list.id] ?? true,
      })),
    inventory,
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
  if ((data.version !== 1 && data.version !== 2) || !Array.isArray(data.lists))
    throw new Error('Formato file non valido');

  const lists: ListExportEntry[] = (data.lists as Record<string, unknown>[]).map(entry => {
    const list = entry.list as Record<string, unknown> | undefined;
    if (!list?.id || typeof list.id !== 'string') throw new Error('Il file contiene liste non valide');
    const currentLevel = typeof entry.currentLevel === 'number' ? entry.currentLevel : 0;

    // v2: explicit level set. v1: single ceiling → every level above current up to it.
    let targetLevels: number[];
    if (Array.isArray(entry.targetLevels)) {
      targetLevels = entry.targetLevels.filter((n): n is number => typeof n === 'number');
    } else if (typeof entry.targetLevel === 'number') {
      targetLevels = [];
      for (let l = currentLevel + 1; l <= entry.targetLevel; l++) targetLevels.push(l);
    } else {
      targetLevels = [];
    }

    return {
      list: list as unknown as List,
      currentLevel,
      targetLevels,
      active: entry.active !== false,
    };
  });

  const inventory = (data.inventory && typeof data.inventory === 'object' && !Array.isArray(data.inventory))
    ? data.inventory as Record<string, number>
    : undefined;

  return { version: 2, exportedAt: String(data.exportedAt ?? new Date().toISOString()), lists, inventory };
}
