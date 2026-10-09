/**
 * Oggetti custom: oggetti di gioco assenti da MetaForge (es. le valute di ricompensa) definiti in
 * `scripts/data/custom-items/items.json` e accodati al catalogo da `fetch-items.mjs`.
 * Qui vivono tipi, validazione, bozza (localStorage) e merge a runtime usati dal Custom Items Studio.
 */
import type { ItemInfo, ItemTranslation } from '@/types';
import customItemsBaseline from '../../scripts/data/custom-items/items.json';

export const CUSTOM_ITEMS_FILE = 'scripts/data/custom-items/items.json';
export const CUSTOM_ITEMS_ICONS_DIR = 'scripts/data/custom-items';
const DRAFT_KEY = 'dev_custom_items_draft';

export const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
export const ICON_EXTENSIONS = ['png', 'svg', 'webp'] as const;
export const MAX_ICON_BYTES = 512 * 1024;

export interface CustomItemDef {
  id: string;
  name: string;
  description: string;
  /** Nome del file sorgente accanto a items.json (vuoto = nessuna icona propria). */
  icon: string;
  rarity: string;
  item_type: string;
  subcategory: string;
  value: number | null;
  workbench: string | null;
  loot_area: string;
  stack_size: number | null;
  translations?: Record<string, ItemTranslation>;
}

export type CustomItemsMap = Record<string, CustomItemDef>;

/** Bozza: gli oggetti e le icone appena caricate (nome file -> data URL), non ancora nel repo. */
export interface CustomItemsDraft {
  items: CustomItemsMap;
  icons: Record<string, string>;
}

export const baselineCustomItems = customItemsBaseline as unknown as CustomItemsMap;

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const isValidItemId = (id: string): boolean => ID_PATTERN.test(id);

export function emptyCustomItem(id = ''): CustomItemDef {
  return {
    id,
    name: '',
    description: '',
    icon: '',
    rarity: 'Common',
    item_type: '',
    subcategory: '',
    value: null,
    workbench: null,
    loot_area: '',
    stack_size: null,
  };
}

// ── bozza ────────────────────────────────────────────────────────────────────

export function readCustomItemsDraft(): CustomItemsDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CustomItemsDraft>;
    if (!parsed.items || typeof parsed.items !== 'object') return null;
    return { items: parsed.items, icons: parsed.icons ?? {} };
  } catch {
    return null;
  }
}

export function writeCustomItemsDraft(draft: CustomItemsDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch { /* quota esaurita o storage non disponibile */ }
}

export function clearCustomItemsDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

/** Oggetti correnti: la bozza se esiste, altrimenti il file del repo. */
export function getEffectiveCustomItems(): CustomItemsMap {
  return readCustomItemsDraft()?.items ?? baselineCustomItems;
}

/** Icone caricate e non ancora scritte nel repo, solo per gli oggetti ancora presenti. */
export function getPendingIcons(draft: CustomItemsDraft | null = readCustomItemsDraft()): Record<string, string> {
  if (!draft) return {};
  const pending: Record<string, string> = {};
  for (const def of Object.values(draft.items)) {
    if (def.icon && draft.icons[def.icon]) pending[def.icon] = draft.icons[def.icon];
  }
  return pending;
}

/** La bozza differisce dal file del repo (oggetti diversi o icone da scrivere). */
export function differsFromBaseline(draft: CustomItemsDraft): boolean {
  return (
    JSON.stringify(serializeCustomItems(draft.items)) !== JSON.stringify(serializeCustomItems(baselineCustomItems)) ||
    Object.keys(getPendingIcons(draft)).length > 0
  );
}

export function isCustomItemsModified(): boolean {
  const draft = readCustomItemsDraft();
  return draft !== null && differsFromBaseline(draft);
}

// ── serializzazione ──────────────────────────────────────────────────────────

function cleanTranslations(translations?: Record<string, ItemTranslation>): Record<string, ItemTranslation> | undefined {
  if (!translations) return undefined;
  const entries = Object.entries(translations)
    .map(([lang, t]) => [lang, { name: (t.name ?? '').trim(), description: (t.description ?? '').trim() }] as const)
    .filter(([, t]) => t.name || t.description);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

/** Forma canonica salvata nel file (stesso ordine dei campi di quello scritto a mano). */
export function serializeCustomItems(items: CustomItemsMap): CustomItemsMap {
  const out: CustomItemsMap = {};
  for (const [id, def] of Object.entries(items)) {
    const translations = cleanTranslations(def.translations);
    out[id] = {
      id,
      name: def.name.trim(),
      description: def.description.trim(),
      icon: def.icon,
      rarity: def.rarity,
      item_type: def.item_type.trim(),
      subcategory: def.subcategory.trim(),
      value: def.value,
      workbench: def.workbench,
      loot_area: def.loot_area.trim(),
      stack_size: def.stack_size,
      ...(translations ? { translations } : {}),
    };
  }
  return out;
}

export function buildCustomItemsFileContent(items: CustomItemsMap): string {
  return JSON.stringify(serializeCustomItems(items), null, 2) + '\n';
}

// ── validazione ──────────────────────────────────────────────────────────────

export interface CustomItemIssues {
  errors: string[];
  warnings: string[];
}

/**
 * `catalogIds`: id del catalogo generato (items.json). Un id presente nel catalogo ma non nel file
 * custom di partenza viene da MetaForge: `fetch-items` ignora la voce custom.
 */
export function validateCustomItem(
  def: CustomItemDef,
  catalogIds: ReadonlySet<string>,
  baselineIds: ReadonlySet<string> = new Set(Object.keys(baselineCustomItems)),
): CustomItemIssues {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!def.id) errors.push('L\'id è obbligatorio.');
  else if (!isValidItemId(def.id)) errors.push('L\'id deve essere in hyphen-case (minuscole, numeri e trattini, es. metal-parts).');
  if (!def.name.trim()) errors.push('Il nome (EN) è obbligatorio.');
  if (!def.item_type.trim()) errors.push('Il tipo è obbligatorio.');
  if (!(RARITIES as readonly string[]).includes(def.rarity)) errors.push('Rarità non valida.');
  if (def.value !== null && (!Number.isFinite(def.value) || def.value < 0)) errors.push('Il valore deve essere un numero ≥ 0.');
  if (def.stack_size !== null && (!Number.isInteger(def.stack_size) || def.stack_size < 1)) errors.push('Lo stack deve essere un intero ≥ 1.');

  if (def.id && catalogIds.has(def.id) && !baselineIds.has(def.id)) {
    warnings.push('Questo id esiste già nel catalogo MetaForge: lo script ignora la voce custom. Rimuovila o scegli un altro id.');
  }
  if (!def.translations?.it?.name?.trim()) warnings.push('Manca il nome in italiano.');

  return { errors, warnings };
}

/** Id che nel catalogo arrivano da MetaForge e quindi vincono sulla voce custom. */
export function isMetaForgeCollision(id: string, catalogIds: ReadonlySet<string>, baselineIds: ReadonlySet<string> = new Set(Object.keys(baselineCustomItems))): boolean {
  return catalogIds.has(id) && !baselineIds.has(id);
}

// ── merge a runtime ──────────────────────────────────────────────────────────

/**
 * Aggiunge (o aggiorna) gli oggetti custom nel catalogo effettivo, per provarli nell'app prima di
 * rigenerare i dati. Solo sviluppo. Le voci in collisione con MetaForge vengono ignorate, come fa lo script.
 */
export function applyCustomItemsDraft(catalog: Record<string, ItemInfo>): void {
  const draft = readCustomItemsDraft();
  if (!draft) return;
  const catalogIds = new Set(Object.keys(catalog));
  const baselineIds = new Set(Object.keys(baselineCustomItems));
  const removed = Object.keys(baselineCustomItems).filter((id) => !draft.items[id]);

  for (const id of removed) delete catalog[id];

  for (const [id, def] of Object.entries(draft.items)) {
    if (isMetaForgeCollision(id, catalogIds, baselineIds)) continue;
    const icon = def.icon && draft.icons[def.icon] ? draft.icons[def.icon] : catalog[id]?.icon ?? null;
    const { icon: _file, ...rest } = def;
    void _file;
    catalog[id] = { ...(catalog[id] ?? {}), ...rest, icon } as ItemInfo;
  }
}
