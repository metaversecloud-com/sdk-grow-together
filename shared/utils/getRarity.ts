import { rarityLevels } from "../constants/plotConfig.js";

export const getRarity = (level: number) => {
  const rarity = rarityLevels[level];
  return rarity;
};
