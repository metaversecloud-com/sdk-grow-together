import { Ecosystem } from "../index.js";
import { EcosystemInventoryItemType } from "../../../shared/index.js";
import { Credentials } from "../../types/Credentials.js";
import { EcosystemItemType } from "../../types/Types.js";
import { standardizeError } from "../standardizeError.js";
import { structureInventoryItemResponse } from "./structureInventoryItemResponse.js";

export const getInventoryItems = async (credentials: Credentials) => {
  try {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const allItems = ecosystem.inventoryItems as EcosystemItemType[];

    let decorations: { [key: string]: EcosystemInventoryItemType } = {};
    let seeds: { [key: string]: EcosystemInventoryItemType } = {};
    let tools: { [key: string]: EcosystemInventoryItemType } = {};

    for (const item of allItems) {
      const data = await structureInventoryItemResponse(item);

      if (item.metadata?.type === "decoration") decorations[item.id] = data;
      else if (item.metadata?.type === "seed") seeds[item.id] = data;
      else if (item.metadata?.type === "tool") tools[item.id] = data;
    }

    // Sort items by sortOrder while keeping them as objects
    const sortedDecorations: { [key: string]: EcosystemInventoryItemType } = {};
    const sortedSeeds: { [key: string]: EcosystemInventoryItemType } = {};
    const sortedTools: { [key: string]: EcosystemInventoryItemType } = {};

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
