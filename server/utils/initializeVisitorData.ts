import { DroppedAsset, Visitor } from "./topiaInit.js";
import {
  Credentials,
  PlotAssetDataObjectType,
  UserItems,
  VisitorDataObjectType,
  VisitorInventoryType,
} from "../types/index.js";
import { DEFAULT_VISITOR_DATA, DEFAULT_VISITOR_WORLD_DATA } from "../constants.js";
import { VisitorInterface } from "@rtsdk/topia";
import { standardizeError } from "./standardizeError.js";
import { getInventoryItems } from "./inventory/getInventoryItems.js";
import { defaultVisitorInventoryItem } from "../../shared/index.js";

/**
 * Initialize visitor data object with default values if it doesn't exist or is missing properties
 */
export const initializeVisitorData = async (credentials: Credentials) => {
  try {
    const { assetId, urlSlug, visitorId } = credentials;

    const visitor = (await Visitor.create(visitorId, urlSlug, { credentials })) as VisitorInterface;
    let visitorData = (await visitor.fetchDataObject()) as VisitorDataObjectType;
    let shouldUpdate = false;

    const lockId = `visitor_data_init_${Math.floor(Date.now() / 60000) * 60000}`;

    if (visitorData.totalCoinsEarned === undefined) {
      visitorData = { ...DEFAULT_VISITOR_DATA, worlds: { [urlSlug]: DEFAULT_VISITOR_WORLD_DATA } };
      // Set the initialized data object
      await visitor.setDataObject(visitorData, {
        lock: { lockId, releaseLock: true },
      });
    }

    if (!visitorData.placedDecorations) {
      shouldUpdate = true;
      visitorData.placedDecorations = {};
    }

    if (!visitorData.worlds[urlSlug]) {
      shouldUpdate = true;
      visitorData.worlds[urlSlug] = DEFAULT_VISITOR_WORLD_DATA;
    } else if (visitorData.worlds[urlSlug].plotAssetId) {
      if (visitorData.worlds[urlSlug].plotAssetId !== assetId) {
        await DroppedAsset.get(visitorData.worlds[urlSlug].plotAssetId, urlSlug, {
          credentials: { ...credentials, assetId: visitorData.worlds[urlSlug].plotAssetId },
        })
          .then(async (plotAsset) => {
            const plotAssetDataObject = (await plotAsset.fetchDataObject()) as PlotAssetDataObjectType;
            if (!plotAssetDataObject.ownerId) visitorData.worlds[urlSlug] = DEFAULT_VISITOR_WORLD_DATA;
          })
          .catch(() => {
            console.error("Visitor plot asset no longer in world");
            // their plot is gone - clear from visitor data object for this world only so they can claim a new one

            visitorData.worlds[urlSlug] = DEFAULT_VISITOR_WORLD_DATA;
          });
      }
    }

    if (shouldUpdate) {
      await visitor.updateDataObject(visitorData, {
        lock: { lockId, releaseLock: true },
      });
    }

    // Get all inventory items - shouldn't need this once all metadata is available on Visitor inventoryItems
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const {
      decorations: ecosystemDecorations,
      seeds: ecosystemSeeds,
      tools: ecosystemTools,
    } = getInventoryItemsResponse;

    await visitor.fetchInventoryItems();
    const allItems = visitor.inventoryItems as UserItems[];

    let coins = 0,
      xp = 0,
      seeds: { [key: string]: any } = {},
      decorations: { [key: string]: any } = {},
      tools: { [key: string]: any } = {};

    for (const item of allItems || []) {
      const { item_id, name = "" } = item;

      if (name === "Coins") {
        coins = item.quantity || 0;
      } else if (name === "Experience Points") {
        xp = item.quantity || 0;
      } else if (name === "Rank") {
        xp = item.quantity || 0;
      } else if (ecosystemSeeds[item_id]) {
        // Merge inventory item with seed data
        seeds[name] = {
          ...defaultVisitorInventoryItem,
          ...ecosystemSeeds[item_id],
          ecosystemItemId: item_id,
          quantity: item.quantity || 0,
        };
      } else if (ecosystemDecorations[item_id]) {
        // Calculate availableQuantity as item.quantity minus the total placed decorations for all urlSlugs
        let placedCount = 0;
        const placedDecorationsForItem = visitorData.placedDecorations?.[name];
        if (placedDecorationsForItem) {
          // Use Object.values and flatMap for better performance
          placedCount = Object.values(placedDecorationsForItem).reduce(
            (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
            0,
          );
        }
        let availableQuantity = (item.quantity || 0) - placedCount;

        // Check for placed decorations for this decorationId in this world
        // this should be updated to check for existence in all worlds once the endpoint is available
        const placedArr = placedDecorationsForItem?.[urlSlug];
        if (placedArr && placedArr.length > 0) {
          // Use Promise.allSettled for parallel existence checks
          const results = await Promise.allSettled(
            placedArr.map((droppedAssetId) =>
              DroppedAsset.get(droppedAssetId, urlSlug, {
                credentials: { ...credentials, assetId: droppedAssetId },
              }),
            ),
          );
          // Remove missing assets and adjust availableQuantity
          for (let i = placedArr.length - 1; i >= 0; i--) {
            if (results[i].status === "rejected") {
              placedArr.splice(i, 1);
              availableQuantity += 1;
            }
          }
          // Clean up empty arrays
          if (placedArr.length === 0) {
            delete placedDecorationsForItem[urlSlug];
          }
          if (Object.keys(placedDecorationsForItem).length === 0) {
            delete visitorData.placedDecorations[name];
          }
        }

        // Merge inventory item with decoration data
        decorations[name] = {
          ...defaultVisitorInventoryItem,
          ...ecosystemDecorations[item_id],
          ecosystemItemId: item_id,
          availableQuantity,
          quantity: item.quantity || 0,
        };
      } else if (ecosystemTools[item_id]) {
        // Merge inventory item with tool data
        tools[name] = {
          ...defaultVisitorInventoryItem,
          ...ecosystemTools[item_id],
          ecosystemItemId: item_id,
          quantity: item.quantity || 0,
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

    return { visitor, visitorData, visitorInventory };
  } catch (error: any) {
    return standardizeError(error);
  }
};
