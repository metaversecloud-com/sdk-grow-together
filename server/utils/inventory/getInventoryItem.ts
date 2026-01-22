import { Credentials, IEcosystemItems } from "../../types/index.js";
import { Ecosystem } from "../topiaInit.js";
import { standardizeError } from "../standardizeError.js";
import { structureInventoryItemResponse } from "./structureInventoryItemResponse.js";

export const getInventoryItem = async (credentials: Credentials, itemName: string) => {
  try {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const inventoryItem = ecosystem.inventoryItems?.find(
      (item) => item.name === itemName && item.status === "ACTIVE",
    ) as IEcosystemItems;
    if (!inventoryItem) throw new Error(`Inventory item ${itemName} not found in ecosystem`);

    const itemData = await structureInventoryItemResponse(inventoryItem);

    return { inventoryItem, itemData };
  } catch (error: any) {
    return standardizeError(error);
  }
};
