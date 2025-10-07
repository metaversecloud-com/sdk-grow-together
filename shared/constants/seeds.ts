/**
 * Shared seed constants between client and server
 */

import { SeedType, s3URL } from "../index.js";

// Crop image variations for each growth level
export const cropImages = {
  1: {
    // Potato (harvest at level 3)
    0: `${s3URL}/potato-0.png`,
    1: `${s3URL}/potato-3.png`,
    // 1: `${s3URL}/potato-1.png`,
    // 2: `${s3URL}/potato-2.png`,
    // 3: `${s3URL}/potato-3.png`,
  },
  2: {
    // Wheat (harvest at level 5)
    0: `${s3URL}/wheat-0.png`,
    1: `${s3URL}/wheat-3.png`,
    // 2: `${s3URL}/wheat-3.png`,
    // 1: `${s3URL}/wheat-1.png`,
    // 2: `${s3URL}/wheat-1.png`,
    // 3: `${s3URL}/wheat-2.png`,
    // 4: `${s3URL}/wheat-2.png`,
    // 5: `${s3URL}/wheat-3.png`,
  },
  3: {
    // Tomato (harvest at level 7)
    0: `${s3URL}/tomato-0.png`,
    1: `${s3URL}/tomato-2.png`,
    2: `${s3URL}/tomato-3.png`,
    // 3: `${s3URL}/tomato-1.png`,
    // 4: `${s3URL}/tomato-2.png`,
    // 5: `${s3URL}/tomato-2.png`,
    // 6: `${s3URL}/tomato-2.png`,
    // 7: `${s3URL}/tomato-3.png`,
  },
  4: {
    // Pumpkin (harvest at level 10)
    0: `${s3URL}/pumpkin-0.png`,
    1: `${s3URL}/pumpkin-2.png`,
    2: `${s3URL}/pumpkin-4.png`,
    // 3: `${s3URL}/pumpkin-1.png`,
    // 4: `${s3URL}/pumpkin-2.png`,
    // 5: `${s3URL}/pumpkin-2.png`,
    // 6: `${s3URL}/pumpkin-2.png`,
    // 7: `${s3URL}/pumpkin-3.png`,
    // 8: `${s3URL}/pumpkin-3.png`,
    // 9: `${s3URL}/pumpkin-3.png`,
    // 10: `${s3URL}/pumpkin-4.png`,
  },
};

export const seeds: Record<number, SeedType> = {
  1: {
    id: 1,
    name: "Potato",
    cost: 0, // Free
    reward: 2,
    growthTime: 60,
    harvestLevel: 1,
    rarity: "common",
    icon: `${s3URL}/potato-icon.png`,
    imageVariations: cropImages[1],
  },
  2: {
    id: 2,
    name: "Wheat",
    cost: 2,
    reward: 3,
    growthTime: 60 * 5,
    harvestLevel: 1,
    rarity: "common",
    icon: `${s3URL}/wheat-icon.png`,
    imageVariations: cropImages[2],
  },
  3: {
    id: 3,
    name: "Tomato",
    cost: 5,
    reward: 20,
    growthTime: 60 * 10,
    harvestLevel: 2,
    rarity: "common",
    icon: `${s3URL}/tomato-icon.png`,
    imageVariations: cropImages[3],
  },
  4: {
    id: 4,
    name: "Pumpkin",
    cost: 10,
    reward: 65,
    growthTime: 60 * 30,
    harvestLevel: 2,
    rarity: "common",
    icon: `${s3URL}/pumpkin-icon.png`,
    imageVariations: cropImages[4],
  },
};
