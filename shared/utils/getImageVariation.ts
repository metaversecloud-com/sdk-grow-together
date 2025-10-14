import { s3URL } from "../constants/plotConfig.js";
import { DecorationType } from "../types/DecorationTypes.js";
import { SeedType } from "../types/SeedTypes.js";

export const getDecorationImageVariation = (decorations: Record<string, DecorationType>, decorationName: string) => {
  const nameDashed = decorationName.replace(/\s+/g, "-");
  const imageUrl = `${s3URL}/decorations/${nameDashed}.png`;
  return imageUrl;
};

export const getSeedImageVariation = (seeds: Record<string, SeedType>, seedName: string, level: number | string) => {
  const nameDashed = seedName.replace(/\s+/g, "-");
  const imageUrl = `${s3URL}/crops/${nameDashed}-${level}.png`;
  return imageUrl;
};
