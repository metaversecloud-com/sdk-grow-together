import { DroppedAsset, Visitor } from "./topiaInit.js";
import { Credentials } from "../types/Credentials.js";
import {
  EcosystemItems,
  PlotAssetDataObjectType,
  VisitorDataObjectType,
  VisitorInventoryType,
} from "../types/index.js";
import { DEFAULT_VISITOR_DATA, DEFAULT_VISITOR_WORLD_DATA } from "../constants.js";
import { VisitorInterface } from "@rtsdk/topia";
import { standardizedError } from "./standardizedError.js";

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

    await visitor.fetchInventoryItems();
    const allItems = visitor.inventoryItems as EcosystemItems[];
    let visitorInventory = {} as VisitorInventoryType;
    for (const item of allItems || []) {
      const itemId = item.name!;
      // Calculate availableQuantity as item.quantity minus the total placed decorations for all urlSlugs
      let placedCount = 0;
      if (visitorData.placedDecorations?.[itemId]) {
        for (const arr of Object.values(visitorData.placedDecorations[itemId])) {
          placedCount += Array.isArray(arr) ? arr.length : 0;
        }
      }
      let availableQuantity = (item.quantity || 0) - placedCount;

      // Check for placed decorations for this decorationId in this world
      // this should be updated to check for existance in all worlds once the endpoint is available
      if (visitorData.placedDecorations?.[itemId]?.[urlSlug]) {
        // Make a copy to avoid mutating while iterating
        const droppedAssetIds = [...visitorData.placedDecorations[itemId][urlSlug]];
        for (const droppedAssetId of droppedAssetIds) {
          await DroppedAsset.get(droppedAssetId, urlSlug, {
            credentials: { ...credentials, assetId: droppedAssetId },
          }).catch(() => {
            // decoration no longer exists in world - remove from array and adjust inventory item quantity
            const arr = visitorData.placedDecorations[itemId][urlSlug];
            const idx = arr.indexOf(droppedAssetId);
            if (idx !== -1) {
              arr.splice(idx, 1);
              availableQuantity += 1;
            }
          });
        }
        // Clean up empty arrays
        if (visitorData.placedDecorations[itemId][urlSlug].length === 0) {
          delete visitorData.placedDecorations[itemId][urlSlug];
        }
        if (Object.keys(visitorData.placedDecorations[itemId]).length === 0) {
          delete visitorData.placedDecorations[itemId];
        }
      }

      visitorInventory[itemId] = {
        id: itemId,
        quantity: item.quantity || 0,
        availableQuantity,
      };
    }

    return { visitor, visitorData, visitorInventory };
  } catch (error: any) {
    return standardizedError(error);
  }
};
