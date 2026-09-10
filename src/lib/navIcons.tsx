import type { ReactNode } from 'react';
import {
  Backpack, LayoutList, ScrollText, Compass, Wrench, ShieldAlert, Database,
  Dice5, Map, Layers, FlaskConical, FileJson, Languages, Settings, Route,
  CircleHelp,
} from 'lucide-react';

/**
 * String-keyed registry: nav config stores an icon name (JSON-serializable),
 * this maps it to a lucide component. Unknown names fall back to a generic icon.
 */
const REGISTRY: Record<string, typeof Backpack> = {
  backpack: Backpack,
  'layout-list': LayoutList,
  'scroll-text': ScrollText,
  compass: Compass,
  wrench: Wrench,
  'shield-alert': ShieldAlert,
  database: Database,
  'dice-5': Dice5,
  map: Map,
  layers: Layers,
  'flask-conical': FlaskConical,
  'file-json': FileJson,
  languages: Languages,
  settings: Settings,
  route: Route,
};

/** Icon names selectable in the dev nav editor. */
export const NAV_ICON_NAMES = Object.keys(REGISTRY);

export function navIcon(name: string, size = 18): ReactNode {
  const Icon = REGISTRY[name] ?? CircleHelp;
  return <Icon size={size} />;
}
