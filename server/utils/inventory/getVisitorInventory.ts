import { VisitorInterface } from "@rtsdk/topia";
import { Credentials, IUserItems, VisitorInventoryType } from "../../types/index.js";
import { standardizeError, structureInventoryItemResponse, Visitor } from "../index.js";
import { defaultVisitorInventoryItem } from "../../../shared/index.js";

/**
 * Retrieve and organize visitor inventory items
 */
export const getVisitorInventory = async (credentials: Credentials): Promise<VisitorInventoryType | Error> => {
  try {
    const { urlSlug, visitorId } = credentials;

    const visitor = (await Visitor.create(visitorId, urlSlug, { credentials })) as VisitorInterface;

    await visitor.fetchInventoryItems();
    const allItems = visitor.inventoryItems as IUserItems[];

    let coins = 0,
      xp = 0,
      seeds: { [key: string]: any } = {},
      decorations: { [key: string]: any } = {},
      tools: { [key: string]: any } = {};

    for (const item of allItems || []) {
      const { item_id, name = "" } = item;

      const data = await structureInventoryItemResponse(item);

      if (name === "Coins") {
        coins = item.quantity || 0;
      } else if (name === "Experience Points") {
        xp = item.quantity || 0;
      } else if (data.type === "decoration") {
        decorations[name] = {
          ...defaultVisitorInventoryItem,
          ...data,
          ecosystemItemId: item_id,
          availableQuantity: item.quantity || 0,
        };
      } else if (data.type === "seed") {
        seeds[name] = {
          ...defaultVisitorInventoryItem,
          ...data,
          ecosystemItemId: item_id,
        };
      } else if (data.type === "tool") {
        tools[name] = {
          ...defaultVisitorInventoryItem,
          ...data,
          ecosystemItemId: item_id,
        };
      }
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
    return standardizeError(error);
  }
};
