import { seeds } from "../../../shared/constants.js";
import { SeedType } from "../../types/index.js";

export const getSeedConfig = (seedId: number): SeedType | null => {
  return seeds[seedId] || null;
};

export const getAllSeedConfigs = (): SeedType[] => {
  return Object.values(seeds);
};

export const getPlantImageUrl = (seedId: number, growLevel: number): string => {
  const seedConfig = getSeedConfig(seedId);
  return seedConfig?.imageVariations[growLevel] || "";
};
