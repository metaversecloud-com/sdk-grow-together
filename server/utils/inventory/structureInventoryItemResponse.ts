import { getRarity } from "../../../shared/index.js";
import { EcosystemItemType } from "../../types/Types.js";

export const structureInventoryItemResponse = async (item: EcosystemItemType) => {
  const itemData = {
    id: item.id,
    name: item.name || "Unknown",
    icon: item.image_path || "",
    cost: item.metadata?.cost || 0,
    rarity: getRarity(item.metadata?.rarity || 0),
    description: item.description || "",
    reward: item.metadata?.reward || 0,
    xp: item.metadata?.xp || 0,
    growthTime: item.metadata?.growthTime || 0,
    harvestLevel: item.metadata?.harvestLevel || 0,
    canBeUsedOnPlot: item.metadata?.canBeUsedOnPlot || false,
    actionType: item.metadata?.actionType || undefined,
    sortOrder: item.metadata?.sortOrder || 0,
    quantity: item.metadata?.quantity || 1,
  };

  return itemData;
};
