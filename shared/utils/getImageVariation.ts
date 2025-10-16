import { s3URL } from "../constants/plotConfig.js";

export const getDecorationImageVariation = (decorationName: string) => {
  const nameDashed = decorationName.replace(/\s+/g, "-");
  const imageUrl = `${s3URL}/decorations/${nameDashed}.png`;
  return imageUrl;
};

export const getSeedImageVariation = (seedName: string, level: number) => {
  const nameDashed = seedName.replace(/\s+/g, "-");
  const imageUrl = `${s3URL}/crops/${nameDashed}-${level}.png`;
  return imageUrl;
};
