/**
 * Category icons resolver for ARC Raiders items.
 * Maps item_type/subcategory values to localized category icon assets in public/icons/categories/*.webp
 *
 * MetaForge's item_type field is unreliable for the "Quick Use" domain: Healing items,
 * Utility items, Gadgets, Grenades and Traps (per arcraiders.wiki/wiki/Quick_Use, each with
 * its own distinct in-game icon) are almost all scraped as item_type "Quick Use" / subcategory
 * "Quick Use". A handful of items outside that domain are misfiled too (e.g. quest-only Keys
 * scraped as item_type "Quest Item"/"Trinket"). The real classification only survives in the
 * curated `subcategory` overrides in items-overrides.json, so those are checked first;
 * item_type stays the primary signal for every other domain (Weapon, Material, ecc., verified
 * against arcraiders.wiki/wiki/Weapons + wiki/Loot — already correct there, no override needed).
 */

const SUBCATEGORY_ICON_MAP: Record<string, string> = {
  healing: 'regenerative.webp',
  utility: 'utility.webp',
  gadget: 'gadget.webp',
  grenade: 'grenade.webp',
  trap: 'trap.webp',
  key: 'key.webp',
  // Outfit sbloccati a pezzi (#109): completo, toggle e colore, icone provvisorie
  outfit: 'outfit.webp',
  'outfit variant': 'outfit-variant.webp',
  'outfit color': 'outfit-color.webp',
};

const ICONS_DIR = 'icons/categories';
const FALLBACK_ICON_FILE = 'misc.webp';

/** File name (in public/icons/categories) for a subcategory/type, or null when there is no signal at all. */
function resolveCategoryIconFile(itemType?: string | null, subcategory?: string | null): string | null {
  const s = subcategory?.toLowerCase().trim();
  if (s && SUBCATEGORY_ICON_MAP[s]) {
    return SUBCATEGORY_ICON_MAP[s];
  }

  if (!itemType) return null;
  const t = itemType.toLowerCase().trim();

  if (t.includes('material') || t === 'recyclable') {
    return 'material.webp';
  }
  if (t.includes('weapon') && !t.includes('mod')) {
    return 'weapon.webp';
  }
  if (t.includes('mod') || t.includes('attachment')) {
    return 'weapon-mod.webp';
  }
  if (t.includes('blueprint')) {
    return 'blueprint.webp';
  }
  if (t.includes('gadget') || t.includes('deployable')) {
    return 'gadget.webp';
  }
  if (t.includes('throwable') || t.includes('grenade') || t.includes('explosive')) {
    return 'grenade.webp';
  }
  if (t.includes('key')) {
    return 'key.webp';
  }
  if (t.includes('quick use') || t.includes('consumable') || t.includes('medical') || t.includes('regenerative')) {
    return 'regenerative.webp';
  }
  if (t.includes('augment')) {
    return 'augment.webp';
  }
  if (t.includes('shield')) {
    return 'shield.webp';
  }
  if (t.includes('trinket') || t.includes('valuable')) {
    return 'trinket.webp';
  }
  if (t.includes('nature') || t.includes('flora')) {
    return 'nature.webp';
  }
  if (t.includes('trap')) {
    return 'trap.webp';
  }
  if (t.includes('utility')) {
    return 'utility.webp';
  }
  if (t.includes('outfit')) {
    return 'outfit.webp';
  }
  if (t.includes('gift')) {
    return 'gift.webp';
  }

  return 'misc.webp';
}

/**
 * `theme: 'light'` serves the dark-ink variant (public/icons/categories/light/) for icons drawn
 * straight on the page background; the default (dark) series is the original light-ink one.
 */
export function getCategoryIconPath(
  itemType?: string | null,
  subcategory?: string | null,
  theme: 'light' | 'dark' = 'dark',
): string | null {
  const file = resolveCategoryIconFile(itemType, subcategory);
  if (!file) return null;
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${ICONS_DIR}/${theme === 'light' ? 'light/' : ''}${file}`;
}

/**
 * Icon for an item that has none of its own (e.g. a custom item not yet drawn), relative to BASE_URL
 * like items.json icons: subcategory icon > category icon > generic fallback.
 */
export function getFallbackItemIcon(itemType?: string | null, subcategory?: string | null): string {
  return `${ICONS_DIR}/${resolveCategoryIconFile(itemType, subcategory) ?? FALLBACK_ICON_FILE}`;
}
