import { Credentials, EcosystemItemType } from "../../types/index.js";
import { Ecosystem } from "../topiaInit.js";
import { standardizeError } from "../standardizeError.js";
import { getRarity } from "../../../shared/index.js";

export const getInventoryItem = async (credentials: Credentials, itemName: string) => {
  try {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const inventoryItem = ecosystem.inventoryItems?.find((item) => item.name === itemName) as EcosystemItemType;
    if (!inventoryItem) throw new Error(`Inventory item ${itemName} not found in ecosystem`);

    const itemData = {
      id: inventoryItem.id,
      name: inventoryItem.name || "Unknown",
      icon: inventoryItem.image_path || "",
      cost: inventoryItem.metadata?.cost || 0,
      rarity: getRarity(inventoryItem.metadata?.rarity || 0),
      description: inventoryItem.description || "",
      reward: inventoryItem.metadata?.reward || 0,
      xp: inventoryItem.metadata?.xp || 0,
      growthTime: inventoryItem.metadata?.growthTime || 0,
      harvestLevel: inventoryItem.metadata?.harvestLevel || 0,
      canBeUsedOnPlot: inventoryItem.metadata?.canBeUsedOnPlot || false,
      actionType: inventoryItem.metadata?.actionType || undefined,
      sortOrder: inventoryItem.metadata?.sortOrder || 0,
    };

    return { inventoryItem, itemData };
  } catch (error: any) {
    return standardizeError(error);
  }
};
