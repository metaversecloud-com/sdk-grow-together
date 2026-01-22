import { InventoryItemType } from "../types";

export const getAnalyticName = (config: InventoryItemType): string => {
  let analyticName = "";
  for (const part of config.name.split(" ")) {
    if (analyticName.length === 0) analyticName += part.toLowerCase();
    else analyticName += part;
  }
  return analyticName;
};
