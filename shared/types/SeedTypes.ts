/**
 * Shared seed types between client and server
 */

import { rarityLevels } from "../index.js";

export type SeedType = {
  id: string;
  name: string;
  cost: number; // 0 for free seeds
  reward: number; // coins earned when harvested
  growthTime: number; // total time in seconds to reach harvest level
  harvestLevel: number; // level when crop is ready for harvest
  rarity: string; // rarity of the seed
  icon: string;
};
