export const rarityOrder: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  amplified: 5,
};

export const rarityHex: Record<string, string> = {
  common: "#6C6C6C",
  uncommon: "#26BF57",
  rare: "#00A8F2",
  epic: "#CC3099",
  legendary: "#ffc600",
  amplified: "#f59e0b",
};

export const getRarityHex = (rarity?: string): string =>
  rarityHex[rarity?.toLowerCase() ?? ""] ?? rarityHex.common;
