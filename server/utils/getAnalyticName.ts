import { EcosystemInventoryItemType } from "../types";

export const getAnalyticName = (config: EcosystemInventoryItemType): string => {
  return config.name.replace(" ", "").toLowerCase();
};
