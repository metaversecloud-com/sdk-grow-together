/**
 * Shared seed types between client and server
 */

export type SeedType = {
  id: number;
  name: string;
  cost: number; // 0 for free seeds
  reward: number; // coins earned when harvested
  growthTime: number; // total time in seconds to reach harvest level
  harvestLevel: number; // level when crop is ready for harvest
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  icon: string; // emoji icon for display
  imageVariations: {
    [growLevel: number]: string; // URL to image for each growth stage (0-harvestLevel)
  };
};
