/** Resolve a local icon path from items.json against the app base URL (/arc-benches/ on Pages). */
export const iconUrl = (icon: string | null | undefined): string | undefined =>
  icon ? `${import.meta.env.BASE_URL}${icon}` : undefined;
