import { defaultVisitorInventoryItem, getRarity } from "../../../shared/index.js";
import { IEcosystemItems } from "../../types/index.js";

export const structureInventoryItem = async (item: IEcosystemItems): Promise<any> => {
  const { id, name, description, image_path, metadata } = item;

  const { cost, rarity, reward, growthTime, harvestLevel, canBeUsedOnPlot, actionType, sortOrder, quantity, type } =
    metadata || defaultVisitorInventoryItem;

  const itemData = {
    id,
    name: name || "Unknown",
    icon: image_path || "",
    cost,
    rarity: getRarity(rarity || 0),
    description: description || "",
    reward,
    growthTime,
    harvestLevel,
    canBeUsedOnPlot,
    actionType,
    sortOrder,
    type,
    quantity,
  };

  return itemData;
};
