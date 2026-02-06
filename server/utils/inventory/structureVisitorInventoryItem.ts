import { UserInventoryItemInterface } from "@rtsdk/topia";
import { defaultVisitorInventoryItem, getRarity } from "../../../shared/index.js";
import { MetadataType } from "../../types/Types.js";

export const structureVisitorInventoryItem = async (visitorItem: UserInventoryItemInterface): Promise<any> => {
  const { name, description = "", image_url = "", image_path = "", status, quantity = 0, item } = visitorItem;

  const { name: itemName, description: itemDescription = "", image_url: itemImageUrl = "", metadata } = item || {};

  const {
    type,
    cost = 0,
    rarity = 0,
    reward = 0,
    growthTime = 0,
    harvestLevel = 0,
    canBeUsedOnPlot = false,
    actionType,
    sortOrder = 0,
  } = (metadata as MetadataType) || {};

  const itemData = {
    ...defaultVisitorInventoryItem,
    type,
    status,
    description: itemDescription || description,
    icon: itemImageUrl || image_url || image_path,
    name: itemName || name,
    availableQuantity: quantity,
    quantity,
    cost,
    reward,
    rarity: getRarity(rarity),
    growthTime,
    harvestLevel,
    canBeUsedOnPlot,
    actionType,
    sortOrder,
  };

  return itemData;
};
