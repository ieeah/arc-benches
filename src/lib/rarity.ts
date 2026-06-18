export const rarityOrder: Record<string, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4,
};

// `border` is the rarity tint at low opacity for card outlines (subtle, not the full-strength color).
export const rarityStyles: Record<string, { color: string; border: string; glow: string }> = {
  common:    { color: 'bg-gray-400',   border: 'border-gray-400/40',   glow: 'shadow-[0_8px_20px_-4px_rgba(156,163,175,0.6)]' },
  uncommon:  { color: 'bg-green-500',  border: 'border-green-500/40',  glow: 'shadow-[0_8px_20px_-4px_rgba(34,197,94,0.6)]' },
  rare:      { color: 'bg-blue-500',   border: 'border-blue-500/40',   glow: 'shadow-[0_8px_20px_-4px_rgba(59,130,246,0.6)]' },
  epic:      { color: 'bg-purple-500', border: 'border-purple-500/40', glow: 'shadow-[0_8px_20px_-4px_rgba(168,85,247,0.6)]' },
  legendary: { color: 'bg-[#ffc600]', border: 'border-[#ffc600]/40', glow: 'shadow-[0_8px_20px_-4px_rgba(255,198,0,0.6)]' },
};

const rarityText: Record<string, string> = {
  common: 'text-gray-400', uncommon: 'text-green-500', rare: 'text-blue-500',
  epic: 'text-purple-500', legendary: 'text-[#ffc600]',
};

export const getRarityStyles = (rarity?: string) =>
  rarityStyles[rarity?.toLowerCase() ?? ''] ?? rarityStyles.common;

export const getRarityText = (rarity?: string) =>
  rarityText[rarity?.toLowerCase() ?? ''] ?? rarityText.common;
