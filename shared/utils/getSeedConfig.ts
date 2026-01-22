import { CropDataObjectType, InventoryItemType } from "../types/index.js";

export const getSeedConfig = (
  ecosystemSeeds: {
    [key: string]: InventoryItemType;
  },
  crop: CropDataObjectType,
) => {
  let seedConfig = ecosystemSeeds[crop.seedId];

  if (!seedConfig) {
    const foundSeed = Object.values(ecosystemSeeds).find((seed: InventoryItemType) => seed.id === crop.seedId);
    if (foundSeed) seedConfig = foundSeed;
  }

  return seedConfig;
};
