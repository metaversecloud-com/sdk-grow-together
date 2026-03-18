import { Credentials } from "../../types/index.js";
import { standardizeError } from "../index.js";
import { getInventoryItems } from "./index.js";

export const getInventoryItem = async (credentials: Credentials, { id, name }: { id?: string; name?: string }) => {
  try {
    if (!id && !name) throw new Error("Either id or name is required to look up an inventory item");

    const { allItems } = await getInventoryItems(credentials);

    const inventoryItem = id
      ? allItems.find((item) => item.id === id && item.status === "ACTIVE")
      : allItems.find((item) => item.name === name && item.status === "ACTIVE");

    if (!inventoryItem) throw new Error(`Inventory item ${id ? `with id ${id}` : `"${name}"`} not found in ecosystem`);

    return inventoryItem;
  } catch (error: any) {
    throw standardizeError(error);
  }
};
