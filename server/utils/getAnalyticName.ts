import { DecorationType, SeedType } from "../types";

export const getAnalyticName = (config: SeedType | DecorationType): string => {
  return config.name.replace(" ", "").toLowerCase();
};
