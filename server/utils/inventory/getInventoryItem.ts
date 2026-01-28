import { Credentials, IEcosystemItems } from "../../types/index.js";
import { standardizeError } from "../index.js";
import { getInventoryItems, structureInventoryItem } from "./index.js";

export const getInventoryItem = async (credentials: Credentials, itemName: string) => {
  try {
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { allItems } = getInventoryItemsResponse;

    const inventoryItem = allItems.find(
      (item) => item.name === itemName && item.status === "ACTIVE",
    ) as IEcosystemItems;
    if (!inventoryItem) throw new Error(`Inventory item ${itemName} not found in ecosystem`);

    const itemData = await structureInventoryItem(inventoryItem);

    return { inventoryItem, itemData };
  } catch (error: any) {
    return standardizeError(error);
  }
};
