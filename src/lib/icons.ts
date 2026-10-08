/**
 * Resolve a local icon path from items.json against the app base URL (/arc-benches/ on Pages).
 * `thumb` serves the 128px variant (public/icons/items/sm/) for small list rows; other paths
 * (e.g. category fallbacks) have no thumbnail and are returned unchanged.
 */
export const iconUrl = (icon: string | null | undefined, thumb = false): string | undefined => {
  if (!icon) return undefined;
  const path = thumb && icon.startsWith('icons/items/') ? icon.replace('icons/items/', 'icons/items/sm/') : icon;
  return `${import.meta.env.BASE_URL}${path}`;
};
