import { UserInventoryItemInterface } from "@rtsdk/topia";
import { defaultVisitorInventoryItem, getRarity } from "../../../shared/index.js";
import { Credentials, InventoryItemType } from "../../types/index.js";
import { getInventoryItem, structureEcosystemInventoryItem } from "../index.js";

export const structureVisitorInventoryItem = async (
  visitorItem: UserInventoryItemInterface,
  credentials: Credentials,
): Promise<any> => {
  const {
    name,
    description = "",
    image_url = "",
    image_path = "",
    status,
    quantity = 0,
    item,
    item_id: ecosystemItemId,
  } = visitorItem;

  const { name: itemName, description: itemDescription = "", image_url: itemImageUrl = "" } = item || {};

  // Look up the matching ecosystem item by ecosystemItemId
  let ecosystemItem: InventoryItemType | undefined;
  if (ecosystemItemId) {
    try {
      const rawItem = await getInventoryItem(credentials, { id: ecosystemItemId });
      ecosystemItem = await structureEcosystemInventoryItem(rawItem);
    } catch {
      // Item not found in ecosystem — fall back to visitor item data
    }
  }

  const itemData = {
    ...defaultVisitorInventoryItem,
    ecosystemItemId,
    type: ecosystemItem?.type,
    status,
    description: ecosystemItem?.description || itemDescription || description,
    icon: ecosystemItem?.icon || itemImageUrl || image_url || image_path,
    name: itemName || name,
    displayName: ecosystemItem?.displayName || itemName || name,
    availableQuantity: quantity,
    quantity,
    cost: ecosystemItem?.cost ?? 0,
    reward: ecosystemItem?.reward ?? 0,
    rarity: ecosystemItem?.rarity ?? getRarity(0),
    growthTime: ecosystemItem?.growthTime ?? 0,
    harvestLevel: ecosystemItem?.harvestLevel ?? 0,
    canBeUsedOnPlot: ecosystemItem?.canBeUsedOnPlot ?? false,
    actionType: ecosystemItem?.actionType,
    sortOrder: ecosystemItem?.sortOrder ?? 0,
  };

  return itemData;
};
