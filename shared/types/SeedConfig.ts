/**
 * Shared seed configuration types between client and server
 */

export interface SeedConfig {
  id: number;
  name: string;
  cost: number; // 0 for free seeds
  reward: number; // coins earned when harvested
  growthTime: number; // total time in seconds to reach harvest level
  harvestLevel: number; // level when plant is ready for harvest
  icon: string; // emoji icon for display
  imageVariations: {
    [growLevel: number]: string; // URL to image for each growth stage (0-harvestLevel)
  };
}

const s3URL = "https://topia-dev-test.s3.us-east-1.amazonaws.com/bounty";

// Plant image variations for each growth level
export const PLANT_IMAGES = {
  1: {
    // Potato (harvest at level 3)
    0: `${s3URL}/potato-0.png`,
    1: `${s3URL}/potato-1.png`,
    2: `${s3URL}/potato-2.png`,
    3: `${s3URL}/potato-3.png`,
  },
  2: {
    // Wheat (harvest at level 5)
    0: `${s3URL}/wheat-0.png`,
    1: `${s3URL}/wheat-1.png`,
    2: `${s3URL}/wheat-1.png`,
    3: `${s3URL}/wheat-2.png`,
    4: `${s3URL}/wheat-2.png`,
    5: `${s3URL}/wheat-3.png`,
  },
  3: {
    // Tomato (harvest at level 7)
    0: `${s3URL}/tomato-0.png`,
    1: `${s3URL}/tomato-1.png`,
    2: `${s3URL}/tomato-1.png`,
    3: `${s3URL}/tomato-1.png`,
    4: `${s3URL}/tomato-2.png`,
    5: `${s3URL}/tomato-2.png`,
    6: `${s3URL}/tomato-2.png`,
    7: `${s3URL}/tomato-3.png`,
  },
  4: {
    // Pumpkin (harvest at level 10)
    0: `${s3URL}/pumpkin-0.png`,
    1: `${s3URL}/pumpkin-0.png`,
    2: `${s3URL}/pumpkin-1.png`,
    3: `${s3URL}/pumpkin-1.png`,
    4: `${s3URL}/pumpkin-2.png`,
    5: `${s3URL}/pumpkin-2.png`,
    6: `${s3URL}/pumpkin-2.png`,
    7: `${s3URL}/pumpkin-3.png`,
    8: `${s3URL}/pumpkin-3.png`,
    9: `${s3URL}/pumpkin-3.png`,
    10: `${s3URL}/pumpkin-4.png`,
  },
};

export const SEED_CONFIGS: Record<number, SeedConfig> = {
  1: {
    id: 1,
    name: "Potato",
    cost: 0, // Free
    reward: 2,
    growthTime: 60 * 2,
    harvestLevel: 3,
    icon: `${s3URL}/potato-icon.png`,
    imageVariations: PLANT_IMAGES[1],
  },
  2: {
    id: 2,
    name: "Wheat",
    cost: 0, // Free
    reward: 3,
    growthTime: 60 * 3,
    harvestLevel: 5,
    icon: `${s3URL}/wheat-icon.png`,
    imageVariations: PLANT_IMAGES[2],
  },
  3: {
    id: 3,
    name: "Tomato",
    cost: 5,
    reward: 8,
    growthTime: 60 * 4,
    harvestLevel: 7,
    icon: `${s3URL}/tomato-icon.png`,
    imageVariations: PLANT_IMAGES[3],
  },
  4: {
    id: 4,
    name: "Pumpkin",
    cost: 10,
    reward: 25,
    growthTime: 60 * 5,
    harvestLevel: 10,
    icon: `${s3URL}/pumpkin-icon.png`,
    imageVariations: PLANT_IMAGES[4],
  },
};

export const getSeedConfig = (seedId: number): SeedConfig | null => {
  return SEED_CONFIGS[seedId] || null;
};

export const getAllSeedConfigs = (): SeedConfig[] => {
  return Object.values(SEED_CONFIGS);
};

export const getPlantImageUrl = (seedId: number, growLevel: number): string => {
  const seedConfig = getSeedConfig(seedId);
  return seedConfig?.imageVariations[growLevel] || "";
};
