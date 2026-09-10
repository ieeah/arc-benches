import type { ReactNode } from 'react';
import { navIcon } from '@/lib/navIcons';
import navConfigSeed from '@/data/nav.json';

const isDev = import.meta.env.DEV;
const DRAFT_KEY = 'arc_benches_dev_nav_draft_v1';

/** A resolved, renderable navigation entry (icons are JSX, labels are final strings). */
export type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  isCategory?: boolean;
  /** Mirrors config `visibility: 'dev'` — only present when the entry is dev-gated. */
  devOnly?: boolean;
  children?: NavItem[];
};

/** Serializable navigation entry as stored in `nav.json` / the dev draft. */
export interface NavConfigItem {
  id: string;
  /** i18n key, resolved via `t()`. Preferred over `label`. */
  labelKey?: string;
  /** Literal label, fallback when no `labelKey` (dev tools, placeholders). */
  label?: string;
  /** Key into the icon registry (see navIcons). */
  icon: string;
  /** Marks a drill-down category (also implied by a non-empty `children`). */
  category?: boolean;
  /** `'dev'` = shown only when `import.meta.env.DEV`. Default `'always'`. */
  visibility?: 'always' | 'dev';
  children?: NavConfigItem[];
}

export interface NavConfig {
  tree: NavConfigItem[];
}

const SEED: NavConfig = navConfigSeed as NavConfig;

/** Reads the bundled seed, overlaid with the dev draft from localStorage when in DEV. */
export function getEffectiveNavConfig(): NavConfig {
  if (isDev) {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.tree)) return parsed as NavConfig;
      }
    } catch { /* ignore */ }
  }
  return SEED;
}

export function getSeedNavConfig(): NavConfig {
  return SEED;
}

export function readNavDraft(): NavConfig | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tree)) return parsed as NavConfig;
    }
  } catch { /* ignore */ }
  return null;
}

export function writeNavDraft(config: NavConfig): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

export function clearNavDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch { /* ignore */ }
}

/** True when a dev draft exists and differs from the bundled seed. */
export function hasNavDraftChanges(): boolean {
  if (!isDev) return false;
  const draft = readNavDraft();
  if (!draft) return false;
  return JSON.stringify(draft) !== JSON.stringify(SEED);
}

interface BuildOpts {
  isDev: boolean;
  t: (key: string) => string;
}

function resolveLabel(item: NavConfigItem, t: BuildOpts['t']): string {
  // A literal `label` is an explicit, untranslated override — it wins when set.
  if (item.label) return item.label;
  if (item.labelKey) {
    const translated = t(item.labelKey);
    if (translated && translated !== item.labelKey) return translated;
    return item.labelKey; // key unresolved: show the key rather than a blank
  }
  return item.id;
}

function buildItems(items: NavConfigItem[], opts: BuildOpts, depth: number): NavItem[] {
  const iconSize = depth === 0 ? 18 : 16;
  const out: NavItem[] = [];
  for (const item of items) {
    if (item.visibility === 'dev' && !opts.isDev) continue;
    const children = item.children ? buildItems(item.children, opts, depth + 1) : undefined;
    // A category whose children are all hidden collapses away.
    if ((item.category || item.children) && (!children || children.length === 0)) continue;
    out.push({
      id: item.id,
      label: resolveLabel(item, opts.t),
      icon: navIcon(item.icon, iconSize),
      ...(item.category ? { isCategory: true } : {}),
      ...(item.visibility === 'dev' ? { devOnly: true } : {}),
      ...(children ? { children } : {}),
    });
  }
  return out;
}

/** Resolves a nav config to renderable `NavItem[]`: labels via `t()`, icons from the registry, `visibility` filtered. */
export function buildNavTree(config: NavConfig, opts: BuildOpts): NavItem[] {
  return buildItems(config.tree, opts, 0);
}

/** Flattens the tree to navigable leaves (drops categories). Used by the quick-favorites picker. */
export function flattenNavLeaves(items: NavItem[]): NavItem[] {
  const out: NavItem[] = [];
  for (const item of items) {
    if (item.children && item.children.length > 0) out.push(...flattenNavLeaves(item.children));
    else out.push(item);
  }
  return out;
}
