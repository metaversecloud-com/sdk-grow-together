/**
 * Shared decoration constants between client and server
 */
import { DecorationType, rarityLevels } from "../index.js";
import { s3URL } from "./plotConfig.js";

export const decorations: Record<number, DecorationType> = {
  1: {
    id: 1,
    name: "Mole",
    cost: 10,
    icon: `${s3URL}/decoration-1.png`,
    imageSrc: `${s3URL}/decoration-1.png`,
    rarity: rarityLevels[0],
    description: "A cute little mole.",
  },
  2: {
    id: 2,
    name: "Not a Mole",
    cost: 10,
    icon: `${s3URL}/decoration-1.png`,
    imageSrc: `${s3URL}/decoration-1.png`,
    rarity: rarityLevels[1],
    description: "Def not a mole.",
  },
};
