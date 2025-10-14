import { Ecosystem } from "../index.js";
import { DecorationType, getRarity, SeedType } from "../../../shared/index.js";
import { Credentials } from "../../types/Credentials.js";
import { EcosystemItems } from "../../types/Types.js";

export const getInventoryItems = async (credentials: Credentials) => {
  try {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const allItems = ecosystem.inventoryItems as EcosystemItems[];

    let decorations: { [key: string]: DecorationType } = {};
    let seeds: { [key: string]: SeedType } = {};

    for (const item of allItems) {
      const rarity = getRarity(item.metadata?.rarity) || "Common";
      if (item.metadata?.type === "decoration") {
        decorations[item.id] = {
          id: item.id,
          name: item.name || "Unknown",
          cost: item.metadata?.cost || 0,
          imageSrc: item.image_path || "",
          rarity,
          description: item.description || "",
        };
      }
      if (item.metadata?.type === "seed") {
        seeds[item.id] = {
          id: item.id,
          name: item.name || "Unknown",
          cost: item.metadata?.cost || 0,
          rarity,
          reward: item.metadata?.reward || 0,
          growthTime: item.metadata?.growthTime || 0,
          harvestLevel: item.metadata?.harvestLevel || 0,
          icon: item.image_path || "",
        };
      }
    }

    return {
      decorations,
      seeds,
    };
  } catch (error: any) {
    return new Error(error);
  }
};
