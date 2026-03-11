import { VisitorInterface } from "@rtsdk/topia";
import { Credentials, VisitorInventoryItemType, VisitorInventoryType } from "../../types/index.js";
import { standardizeError, structureVisitorInventoryItem, Visitor } from "../index.js";

/**
 * Retrieve and organize visitor inventory items
 */
export const getVisitorInventory = async (credentials: Credentials): Promise<VisitorInventoryType> => {
  try {
    const { urlSlug, visitorId } = credentials;

    const visitor = (await Visitor.create(visitorId, urlSlug, { credentials })) as VisitorInterface;

    await visitor.fetchInventoryItems();
    const allItems = visitor.inventoryItems;

    let coins = 0,
      xp = 0,
      seeds: { [key: string]: VisitorInventoryItemType } = {},
      decorations: { [key: string]: VisitorInventoryItemType } = {},
      tools: { [key: string]: VisitorInventoryItemType } = {};

    for (const visitorItem of allItems || []) {
      const itemData = await structureVisitorInventoryItem(visitorItem);

      const { name, status, quantity, type } = itemData;
      if (status !== "ACTIVE" || !name) continue;

      if (name === "Coins") coins = quantity || 0;
      else if (name === "Experience Points") xp = quantity || 0;
      else if (type === "decoration") decorations[name] = itemData;
      else if (type === "seed") seeds[name] = itemData;
      else if (type === "tool") tools[name] = itemData;
    }

    // Sort items by sortOrder while keeping them as objects
    const sortedDecorations: { [key: string]: (typeof decorations)[keyof typeof decorations] } = {};
    const sortedSeeds: { [key: string]: (typeof seeds)[keyof typeof seeds] } = {};
    const sortedTools: { [key: string]: (typeof tools)[keyof typeof tools] } = {};

    // Sort decorations
    Object.values(decorations)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((decoration) => {
        sortedDecorations[decoration.name] = decoration;
      });

    // Sort seeds
    Object.values(seeds)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((seed) => {
        sortedSeeds[seed.name] = seed;
      });

    // Sort tools
    Object.values(tools)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((tool) => {
        sortedTools[tool.name] = tool;
      });

    const visitorInventory: VisitorInventoryType = {
      coins,
      xp,
      seeds: sortedSeeds,
      decorations: sortedDecorations,
      tools: sortedTools,
    };

    return visitorInventory;
  } catch (error: any) {
    throw standardizeError(error);
  }
};
