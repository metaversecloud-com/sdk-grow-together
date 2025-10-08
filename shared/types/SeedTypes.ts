/**
 * Shared seed types between client and server
 */

import { rarityLevels } from "../index.js";

export type SeedType = {
  id: number;
  name: string;
  cost: number; // 0 for free seeds
  reward: number; // coins earned when harvested
  growthTime: number; // total time in seconds to reach harvest level
  harvestLevel: number; // level when crop is ready for harvest
  rarity: (typeof rarityLevels)[number]; // rarity of the seed
  icon: string; // emoji icon for display
  imageVariations: {
    [growLevel: number]: string; // URL to image for each growth stage (0-harvestLevel)
  };
};
