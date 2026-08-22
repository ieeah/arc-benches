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
};

export function getCategoryIconPath(itemType?: string | null, subcategory?: string | null): string | null {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;

  const s = subcategory?.toLowerCase().trim();
  if (s && SUBCATEGORY_ICON_MAP[s]) {
    return `${prefix}icons/categories/${SUBCATEGORY_ICON_MAP[s]}`;
  }

  if (!itemType) return null;
  const t = itemType.toLowerCase().trim();

  if (t.includes('material') || t === 'recyclable') {
    return `${prefix}icons/categories/material.webp`;
  }
  if (t.includes('weapon') && !t.includes('mod')) {
    return `${prefix}icons/categories/weapon.webp`;
  }
  if (t.includes('mod') || t.includes('attachment')) {
    return `${prefix}icons/categories/weapon-mod.webp`;
  }
  if (t.includes('blueprint')) {
    return `${prefix}icons/categories/blueprint.webp`;
  }
  if (t.includes('gadget') || t.includes('deployable')) {
    return `${prefix}icons/categories/gadget.webp`;
  }
  if (t.includes('throwable') || t.includes('grenade') || t.includes('explosive')) {
    return `${prefix}icons/categories/grenade.webp`;
  }
  if (t.includes('key')) {
    return `${prefix}icons/categories/key.webp`;
  }
  if (t.includes('quick use') || t.includes('consumable') || t.includes('medical') || t.includes('regenerative')) {
    return `${prefix}icons/categories/regenerative.webp`;
  }
  if (t.includes('augment')) {
    return `${prefix}icons/categories/augment.webp`;
  }
  if (t.includes('shield')) {
    return `${prefix}icons/categories/shield.webp`;
  }
  if (t.includes('trinket') || t.includes('valuable')) {
    return `${prefix}icons/categories/trinket.webp`;
  }
  if (t.includes('nature') || t.includes('flora')) {
    return `${prefix}icons/categories/nature.webp`;
  }
  if (t.includes('trap')) {
    return `${prefix}icons/categories/trap.webp`;
  }
  if (t.includes('utility')) {
    return `${prefix}icons/categories/utility.webp`;
  }
  if (t.includes('gift')) {
    return `${prefix}icons/categories/gift.webp`;
  }

  return `${prefix}icons/categories/misc.webp`;
}
