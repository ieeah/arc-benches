import type { AppLanguage } from '@/i18n/types';
import type { List, ListExportEntry, ListExportFile, MultiProfileExportFile, ProfileExportEntry } from '@/types';
import { isObject, sanitizeBoolRecord, sanitizeNumberRecord, validateList, validateProfile } from '@/lib/validate';

export function downloadExport(data: ListExportFile | MultiProfileExportFile): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arc-lists-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Validate + normalize one exported list entry. Returns null if the list itself is unusable. */
function parseListEntry(raw: unknown): ListExportEntry | null {
  if (!isObject(raw)) return null;
  const list = validateList(raw.list);
  if (!list) return null;

  const currentLevel = typeof raw.currentLevel === 'number' && raw.currentLevel >= 0
    ? Math.floor(raw.currentLevel) : 0;

  // v2: explicit level set. v1: single ceiling → every level above current up to it.
  let targetLevels: number[];
  if (Array.isArray(raw.targetLevels)) {
    targetLevels = raw.targetLevels
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0)
      .map(n => Math.floor(n));
  } else if (typeof raw.targetLevel === 'number') {
    targetLevels = [];
    for (let l = currentLevel + 1; l <= raw.targetLevel; l++) targetLevels.push(l);
  } else {
    targetLevels = [];
  }

  return { list, currentLevel, targetLevels, active: raw.active !== false };
}

export function parseImport(json: string): ListExportFile | MultiProfileExportFile {
  const data: unknown = JSON.parse(json);
  if (!isObject(data)) throw new Error('Formato file non valido');

  // ── v3: multi-profile ──────────────────────────────────────────────────────
  if (data.version === 3) {
    if (!Array.isArray(data.profiles) || !Array.isArray(data.sharedLists))
      throw new Error('Formato file non valido');

    const sharedLists = data.sharedLists.map(validateList).filter((l): l is List => l !== null);
    const profiles: ProfileExportEntry[] = data.profiles
      .map((raw): ProfileExportEntry | null => {
        if (!isObject(raw)) return null;
        const profile = validateProfile(raw.profile);
        if (!profile) return null;
        const lists = Array.isArray(raw.lists)
          ? raw.lists.map(parseListEntry).filter((e): e is ListExportEntry => e !== null)
          : [];
        const enabledSections = isObject(raw.enabledSections) ? raw.enabledSections as Record<string, boolean> : undefined;
        const language = typeof raw.language === 'string' ? raw.language as AppLanguage : undefined;
        const checkedActions = isObject(raw.checkedActions) ? sanitizeBoolRecord(raw.checkedActions) : undefined;
        const listOrder = Array.isArray(raw.listOrder)
          ? raw.listOrder.filter((s): s is string => typeof s === 'string' && s.length > 0)
          : undefined;
        const completedExpeditionsCount = typeof raw.completedExpeditionsCount === 'number' && Number.isFinite(raw.completedExpeditionsCount) && raw.completedExpeditionsCount >= 0
          ? Math.floor(raw.completedExpeditionsCount)
          : undefined;
        const earnedPermanentSkillPoints = typeof raw.earnedPermanentSkillPoints === 'number' && Number.isFinite(raw.earnedPermanentSkillPoints) && raw.earnedPermanentSkillPoints >= 0
          ? Math.floor(raw.earnedPermanentSkillPoints)
          : undefined;
        const consecutiveStreak = typeof raw.consecutiveStreak === 'number' && Number.isFinite(raw.consecutiveStreak) && raw.consecutiveStreak >= 0
          ? Math.floor(raw.consecutiveStreak)
          : undefined;
        const departureWindowActive = typeof raw.departureWindowActive === 'boolean' ? raw.departureWindowActive : undefined;
        const ownedBlueprints = isObject(raw.ownedBlueprints) ? sanitizeBoolRecord(raw.ownedBlueprints) : undefined;
        const filterHideCompleted = typeof raw.filterHideCompleted === 'boolean' ? raw.filterHideCompleted : undefined;
        const filterHideOwnedBlueprints = typeof raw.filterHideOwnedBlueprints === 'boolean' ? raw.filterHideOwnedBlueprints : undefined;
        const activePersonalityId = typeof raw.activePersonalityId === 'string' && raw.activePersonalityId.length > 0
          ? raw.activePersonalityId
          : raw.activePersonalityId === null
            ? null
            : undefined;

        return {
          profile,
          lists,
          inventory: sanitizeNumberRecord(raw.inventory),
          language,
          enabledSections,
          checkedActions,
          listOrder,
          completedExpeditionsCount,
          earnedPermanentSkillPoints,
          consecutiveStreak,
          departureWindowActive,
          ownedBlueprints,
          filterHideCompleted,
          filterHideOwnedBlueprints,
          activePersonalityId,
        };
      })
      .filter((p): p is ProfileExportEntry => p !== null);

    if (profiles.length === 0) throw new Error('Il file non contiene profili validi');
    return { version: 3, exportedAt: String(data.exportedAt ?? new Date().toISOString()), sharedLists, profiles };
  }

  // ── v1 / v2: single-profile (still accepted on import) ──────────────────────
  if ((data.version !== 1 && data.version !== 2) || !Array.isArray(data.lists))
    throw new Error('Formato file non valido');

  const lists = data.lists.map(parseListEntry).filter((e): e is ListExportEntry => e !== null);

  const inventory = isObject(data.inventory) ? sanitizeNumberRecord(data.inventory) : undefined;

  return { version: 2, exportedAt: String(data.exportedAt ?? new Date().toISOString()), lists, inventory };
}
