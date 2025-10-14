export const rarityLevels = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export const getRarity = (level: number) => {
  const rarity = rarityLevels[level];
  return rarity;
};
