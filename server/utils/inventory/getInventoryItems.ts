import { Ecosystem } from "../index.js";
import { DecorationType, getRarity, SeedType } from "../../../shared/index.js";
import { Credentials } from "../../types/Credentials.js";
import { EcosystemItemType } from "../../types/Types.js";
import { standardizeError } from "../standardizeError.js";

export const getInventoryItems = async (credentials: Credentials) => {
  try {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const allItems = ecosystem.inventoryItems as EcosystemItemType[];

    let decorations: { [key: string]: DecorationType } = {};
    let seeds: { [key: string]: SeedType } = {};
    let tools: { [key: string]: DecorationType } = {};

    for (const item of allItems) {
      const rarity = getRarity(item.metadata?.rarity || 0);

      const data = {
        id: item.id,
        name: item.name || "Unknown",
        icon: item.image_path || "",
        cost: item.metadata?.cost || 0,
        rarity,
        description: item.description || "",
        reward: item.metadata?.reward || 0,
        growthTime: item.metadata?.growthTime || 0,
        harvestLevel: item.metadata?.harvestLevel || 0,
        canBeUsedOnPlot: item.metadata?.canBeUsedOnPlot || false,
        actionType: item.metadata?.actionType || undefined,
        sortOrder: item.metadata?.sortOrder || 0,
      };

      if (item.metadata?.type === "decoration") decorations[item.id] = data;
      else if (item.metadata?.type === "seed") seeds[item.id] = data;
      else if (item.metadata?.type === "tool") tools[item.id] = data;
    }

    // Sort items by sortOrder while keeping them as objects
    const sortedDecorations: { [key: string]: DecorationType } = {};
    const sortedSeeds: { [key: string]: SeedType } = {};
    const sortedTools: { [key: string]: DecorationType } = {};

    // Sort decorations
    Object.values(decorations)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((decoration) => {
        sortedDecorations[decoration.id] = decoration;
      });

    // Sort seeds
    Object.values(seeds)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((seed) => {
        sortedSeeds[seed.id] = seed;
      });

    // Sort tools
    Object.values(tools)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((tool) => {
        sortedTools[tool.id] = tool;
      });

    return {
      decorations: sortedDecorations,
      seeds: sortedSeeds,
      tools: sortedTools,
    };
  } catch (error: any) {
    return standardizeError(error);
  }
};
