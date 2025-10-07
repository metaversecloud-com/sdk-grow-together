/**
 * Shared decoration constants between client and server
 */
import { DecorationType } from "../index.js";
import { s3URL } from "./plotConfig.js";

export const decorations: Record<number, DecorationType> = {
  1: {
    id: 1,
    name: "Mole",
    cost: 10,
    icon: `${s3URL}/decoration-1.png`,
    imageSrc: `${s3URL}/decoration-1.png`,
    rarity: "common",
  },
};
