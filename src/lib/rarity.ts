export const rarityOrder: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export const rarityHex: Record<string, string> = {
  common: "#6C6C6C",
  uncommon: "#26BF57",
  rare: "#00A8F2",
  epic: "#CC3099",
  legendary: "#ffc600",
};

export const getRarityHex = (rarity?: string): string =>
  rarityHex[rarity?.toLowerCase() ?? ""] ?? rarityHex.common;

export const rarityStyles: Record<
  string,
  { color: string; border: string; glow: string; hex: string }
> = {
  common: {
    color: "bg-[#6C6C6C]",
    border: "border-[#6C6C6C]/40",
    glow: "shadow-[0_8px_20px_-4px_rgba(108,108,108,0.5)]",
    hex: "#6C6C6C",
  },
  uncommon: {
    color: "bg-[#26BF57]",
    border: "border-[#26BF57]/40",
    glow: "shadow-[0_8px_20px_-4px_rgba(38,191,87,0.5)]",
    hex: "#26BF57",
  },
  rare: {
    color: "bg-[#00A8F2]",
    border: "border-[#00A8F2]/40",
    glow: "shadow-[0_8px_20px_-4px_rgba(0,168,242,0.5)]",
    hex: "#00A8F2",
  },
  epic: {
    color: "bg-[#CC3099]",
    border: "border-[#CC3099]/40",
    glow: "shadow-[0_8px_20px_-4px_rgba(204,48,153,0.5)]",
    hex: "#CC3099",
  },
  legendary: {
    color: "bg-[#ffc600]",
    border: "border-[#ffc600]/40",
    glow: "shadow-[0_8px_20px_-4px_rgba(255,198,0,0.5)]",
    hex: "#ffc600",
  },
};

const rarityText: Record<string, string> = {
  common: "text-[#6C6C6C]",
  uncommon: "text-[#26BF57]",
  rare: "text-[#00A8F2]",
  epic: "text-[#CC3099]",
  legendary: "text-[#ffc600]",
};

export const getRarityStyles = (rarity?: string) =>
  rarityStyles[rarity?.toLowerCase() ?? ""] ?? rarityStyles.common;

export const getRarityText = (rarity?: string) =>
  rarityText[rarity?.toLowerCase() ?? ""] ?? rarityText.common;

export const getRarityGradient = (
  rarity?: string,
  isDark: boolean = false,
): string => {
  const hex = getRarityHex(rarity);
  const endBg = isDark ? "#000000" : "#ffffff";
  return `linear-gradient(45deg, ${hex} 0%, ${hex} 25%, ${endBg} 100%)`;
};
