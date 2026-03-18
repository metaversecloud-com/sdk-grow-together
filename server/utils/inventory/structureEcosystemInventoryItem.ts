import { InventoryItemInterface } from "@rtsdk/topia";
import { getRarity } from "../../../shared/index.js";
import { MetadataType } from "../../types/Types.js";

export const structureEcosystemInventoryItem = async (item: InventoryItemInterface): Promise<any> => {
  const { id, name, description, image_path, metadata } = item;

  const {
    displayName,
    cost,
    rarity,
    reward,
    growthTime,
    harvestLevel,
    canBeUsedOnPlot,
    actionType,
    sortOrder,
    quantity,
    type,
  } = (metadata as MetadataType) || {};

  const itemData = {
    id,
    name: name || "Unknown",
    displayName: displayName || name || "Unknown",
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
