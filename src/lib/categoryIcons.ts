/**
 * Category icons resolver for ARC Raiders items.
 * Maps MetaForge item_type values to localized category icon assets in public/icons/categories/*.webp
 */

export function getCategoryIconPath(itemType?: string | null): string | null {
  if (!itemType) return null;
  const t = itemType.toLowerCase().trim();
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;

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
