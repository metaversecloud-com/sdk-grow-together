import { getRarity } from "../../../shared/index.js";
import { IEcosystemItems, IUserItems } from "../../types/index.js";

export const structureInventoryItemResponse = async (item: IEcosystemItems | IUserItems): Promise<any> => {
  const { id, name, description, image_path, image_url, metadata, itemMetadata } = item;

  const icon = image_path !== "" ? image_path : image_url !== "" ? image_url : "";

  let metadataToUse = Object.keys(metadata || {}).length > 0 ? metadata : itemMetadata;
  const { cost, rarity, reward, xp, growthTime, harvestLevel, canBeUsedOnPlot, actionType, sortOrder, quantity, type } =
    metadataToUse || {
      cost: 0,
      rarity: 0,
      reward: 0,
      xp: 0,
      growthTime: 0,
      harvestLevel: 0,
      canBeUsedOnPlot: false,
      actionType: undefined,
      sortOrder: 0,
      quantity: 0,
    };

  const itemData = {
    id,
    name: name || "Unknown",
    icon,
    cost,
    rarity: getRarity(rarity || 0),
    description: description || "",
    reward,
    xp,
    growthTime,
    harvestLevel,
    canBeUsedOnPlot,
    actionType,
    sortOrder,
    quantity: item.quantity || quantity || 0,
    type,
  };

  return itemData;
};
