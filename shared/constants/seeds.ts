/**
 * Shared seed constants between client and server
 */
import { SeedType, rarityLevels } from "../index.js";
import { s3URL } from "./plotConfig.js";

export const getImageVariation = (seedId: string, level: number | string) => {
  const nameDashed = seeds[seedId].name.replace(/\s+/g, "-");
  const imageUrl = `${s3URL}/crops/${nameDashed}-${level}.png`;
  return imageUrl;
};

// {"cost":0,"type":"seed","rarity": 0,"reward": 1,"growthTime": 60,"levels": 1}

export const seeds: Record<string, SeedType> = {
  "carrots": {
    id: "carrots",
    name: "Carrots",
    cost: 0,
    reward: 1,
    growthTime: 1 * 60,
    harvestLevel: 1,
    rarity: rarityLevels[0],
  },
  "onions": {
    id: "onions",
    name: "Onions",
    cost: 10,
    reward: 5,
    growthTime: 2 * 60,
    harvestLevel: 2,
    rarity: rarityLevels[0],
  },

  "blueberries": {
    id: "blueberries",
    name: "Blueberries",
    cost: 500,
    reward: 20,
    growthTime: 5 * 60,
    harvestLevel: 3,
    rarity: rarityLevels[0],
  },
  "daisies": {
    id: "daisies",
    name: "Daisies",
    cost: 500,
    reward: 100,
    growthTime: 60 * 60,
    harvestLevel: 2,
    rarity: rarityLevels[0],
  },
  "tomatoes": {
    id: "tomatoes",
    name: "Tomatoes",
    cost: 2000,
    reward: 4,
    growthTime: 1 * 60,
    harvestLevel: 2,
    rarity: rarityLevels[0],
  },
  "watermelon": {
    id: "watermelon",
    name: "Watermelon",
    cost: 2000,
    reward: 15,
    growthTime: 2 * 60,
    harvestLevel: 3,
    rarity: rarityLevels[0],
  },
  "strawberries": {
    id: "strawberries",
    name: "Strawberries",
    cost: 3000,
    reward: 55,
    growthTime: 10 * 60,
    harvestLevel: 2,
    rarity: rarityLevels[0],
  },
  "red tulips": {
    id: "red tulips",
    name: "Red Tulips",
    cost: 3000,
    reward: 300,
    growthTime: 75 * 60,
    harvestLevel: 3,
    rarity: rarityLevels[0],
  },
  "peppers": {
    id: "peppers",
    name: "Peppers",
    cost: 6000,
    reward: 9,
    growthTime: 2 * 60,
    harvestLevel: 1,
    rarity: rarityLevels[1],
  },
  "sweet corn": {
    id: "sweet corn",
    name: "Sweet Corn",
    cost: 6000,
    reward: 30,
    growthTime: 2.5 * 60,
    harvestLevel: 2,
    rarity: rarityLevels[1],
  },
  "pumpkins": {
    id: "pumpkins",
    name: "Pumpkins",
    cost: 25000,
    reward: 70,
    growthTime: 4 * 60,
    harvestLevel: 2,
    rarity: rarityLevels[1],
  },
  "sunflowers": {
    id: "sunflowers",
    name: "Sunflowers",
    cost: 15000,
    reward: 1000,
    growthTime: 120 * 60,
    harvestLevel: 2,
    rarity: rarityLevels[2],
  },
};
