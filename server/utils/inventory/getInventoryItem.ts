import { Credentials } from "../../types";
import { Ecosystem } from "../topiaInit";

export const getInventoryItem = async (credentials: Credentials, itemName: string) => {
  try {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();
    const inventoryItem = ecosystem.inventoryItems?.find((item) => item.name === itemName);
    if (!inventoryItem) throw new Error(`Inventory item ${itemName} not found in ecosystem`);
    return inventoryItem;
  } catch (error: any) {
    return new Error(error);
  }
};
