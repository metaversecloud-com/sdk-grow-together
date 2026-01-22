import { InventoryItemType } from "../../types";

const rarityLevels = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export const getXpRewardAmount = (seedConfig: InventoryItemType, action: string) => {
  const { growthTime, harvestLevel, rarity } = seedConfig;

  const rarityIndex = rarityLevels.indexOf(rarity);

  const multiplier =
    rarityIndex === 1 ? 1.25 : rarityIndex === 2 ? 1.5 : rarityIndex === 3 ? 1.75 : rarityIndex === 4 ? 2 : 1;

  let rewardAmount = Math.ceil((growthTime / 60) * harvestLevel * multiplier);

  if (action === "Water") rewardAmount = Math.ceil(rewardAmount * 0.1);
  else if (action === "Plant") rewardAmount = Math.ceil(rewardAmount * 0.4);

  return rewardAmount;
};
