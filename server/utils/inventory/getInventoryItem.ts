import { Credentials } from "../../types/index.js";
import { standardizeError } from "../index.js";
import { getInventoryItems } from "./index.js";

export const getInventoryItem = async (credentials: Credentials, itemName: string) => {
  try {
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { allItems } = getInventoryItemsResponse;

    const inventoryItem = allItems.find((item) => item.name === itemName && item.status === "ACTIVE");
    if (!inventoryItem) throw new Error(`Inventory item ${itemName} not found in ecosystem`);

    return inventoryItem;
  } catch (error: any) {
    return standardizeError(error);
  }
};
