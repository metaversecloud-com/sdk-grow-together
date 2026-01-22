import { Ecosystem } from "../index.js";
import { Credentials, IUserItems, InventoryItemType } from "../../types/index.js";
import { standardizeError } from "../standardizeError.js";
import { structureInventoryItemResponse } from "./structureInventoryItemResponse.js";

export const getInventoryItems = async (credentials: Credentials) => {
  try {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const allItems = ecosystem.inventoryItems as unknown as IUserItems[];

    let ecosystemDecorations: { [key: string]: InventoryItemType } = {};
    let ecosystemSeeds: { [key: string]: InventoryItemType } = {};
    let ecosystemTools: { [key: string]: InventoryItemType } = {};

    for (const item of allItems) {
      if (item.status !== "ACTIVE") continue;

      const data = await structureInventoryItemResponse(item);

      if (data.type === "decoration") ecosystemDecorations[data.name] = data;
      else if (data.type === "seed") ecosystemSeeds[data.name] = data;
      else if (data.type === "tool") ecosystemTools[data.name] = data;
    }

    // Sort items by sortOrder while keeping them as objects
    const sortedDecorations: { [key: string]: InventoryItemType } = {};
    const sortedSeeds: { [key: string]: InventoryItemType } = {};
    const sortedTools: { [key: string]: InventoryItemType } = {};

    // Sort decorations
    Object.values(ecosystemDecorations)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((decoration) => {
        sortedDecorations[decoration.name] = decoration;
      });

    // Sort seeds
    Object.values(ecosystemSeeds)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((seed) => {
        sortedSeeds[seed.name] = seed;
      });

    // Sort tools
    Object.values(ecosystemTools)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((tool) => {
        sortedTools[tool.name] = tool;
      });

    return {
      ecosystemDecorations: sortedDecorations,
      ecosystemSeeds: sortedSeeds,
      ecosystemTools: sortedTools,
    };
  } catch (error: any) {
    return standardizeError(error);
  }
};
