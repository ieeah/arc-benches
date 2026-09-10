import type { NavConfig, NavConfigItem } from '@/lib/navTree';

export const ROOT_CONTAINER = '__root__';

export interface Located {
  item: NavConfigItem;
  container: string; // ROOT_CONTAINER or a category id
  index: number;
}

/** All draggable item ids grouped by container. Categories live in root alongside leaves. */
export function containersOf(config: NavConfig): Record<string, string[]> {
  const map: Record<string, string[]> = { [ROOT_CONTAINER]: [] };
  for (const item of config.tree) {
    map[ROOT_CONTAINER].push(item.id);
    if (item.category || item.children) {
      map[item.id] = (item.children ?? []).map(c => c.id);
    }
  }
  return map;
}

export function locate(config: NavConfig, id: string): Located | null {
  for (let i = 0; i < config.tree.length; i++) {
    const item = config.tree[i];
    if (item.id === id) return { item, container: ROOT_CONTAINER, index: i };
    const children = item.children ?? [];
    for (let j = 0; j < children.length; j++) {
      if (children[j].id === id) return { item: children[j], container: item.id, index: j };
    }
  }
  return null;
}

function clone(config: NavConfig): NavConfig {
  return JSON.parse(JSON.stringify(config)) as NavConfig;
}

function detach(config: NavConfig, id: string): { next: NavConfig; item: NavConfigItem } | null {
  const next = clone(config);
  const loc = locate(next, id);
  if (!loc) return null;
  if (loc.container === ROOT_CONTAINER) {
    const [item] = next.tree.splice(loc.index, 1);
    return { next, item };
  }
  const parent = next.tree.find(t => t.id === loc.container)!;
  const [item] = (parent.children ?? []).splice(loc.index, 1);
  return { next, item };
}

/**
 * Moves `id` to `toContainer` at `toIndex`. Categories may only live in root.
 * Returns the original config unchanged if the move is invalid.
 */
export function moveItem(config: NavConfig, id: string, toContainer: string, toIndex: number): NavConfig {
  const loc = locate(config, id);
  if (!loc) return config;
  const isCategory = Boolean(loc.item.category || loc.item.children);
  if (isCategory && toContainer !== ROOT_CONTAINER) return config;

  const detached = detach(config, id);
  if (!detached) return config;
  const { next, item } = detached;

  if (toContainer === ROOT_CONTAINER) {
    const clamped = Math.max(0, Math.min(toIndex, next.tree.length));
    next.tree.splice(clamped, 0, item);
  } else {
    const parent = next.tree.find(t => t.id === toContainer);
    if (!parent) return config;
    parent.children = parent.children ?? [];
    const clamped = Math.max(0, Math.min(toIndex, parent.children.length));
    parent.children.splice(clamped, 0, item);
  }
  return next;
}

export function patchItem(config: NavConfig, id: string, patch: Partial<NavConfigItem>): NavConfig {
  const next = clone(config);
  const loc = locate(next, id);
  if (!loc) return config;
  Object.assign(loc.item, patch);
  // Normalize away empty-string fields so the JSON stays clean.
  if (loc.item.label === '') delete loc.item.label;
  if (loc.item.labelKey === '') delete loc.item.labelKey;
  return next;
}
