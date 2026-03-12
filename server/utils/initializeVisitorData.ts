import { DroppedAsset, Visitor } from "./topiaInit.js";
import { Credentials, PlotAssetDataObjectType, VisitorDataObjectType } from "../types/index.js";
import { DEFAULT_VISITOR_DATA, DEFAULT_VISITOR_WORLD_DATA } from "../constants.js";
import { VisitorInterface } from "@rtsdk/topia";
import { standardizeError } from "./standardizeError.js";
import { getVisitorInventory } from "./inventory/getVisitorInventory.js";

/**
 * Initialize visitor data object with default values if it doesn't exist or is missing properties
 */
export const initializeVisitorData = async (credentials: Credentials) => {
  try {
    const { assetId, profileId, urlSlug, visitorId } = credentials;

    const visitor = (await Visitor.create(visitorId, urlSlug, { credentials })) as VisitorInterface;
    let visitorData = (await visitor.fetchDataObject()) as VisitorDataObjectType;
    let shouldUpdate = false;
    const now = Date.now();

    const lockId = `visitor_data_init_${Math.floor(now / 60000) * 60000}`;

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
            if (!plotAssetDataObject.ownerId || plotAssetDataObject.ownerId !== profileId)
              visitorData.worlds[urlSlug] = DEFAULT_VISITOR_WORLD_DATA;
          })
          .catch(() => {
            console.error("Visitor plot asset no longer in world");
            // their plot is gone - clear from visitor data object for this world only so they can claim a new one

            visitorData.worlds[urlSlug] = DEFAULT_VISITOR_WORLD_DATA;
          });
      }
    }

    const visitorInventory = await getVisitorInventory(credentials);

    if (shouldUpdate) {
      await visitor.updateDataObject(visitorData, {
        lock: { lockId, releaseLock: true },
      });
    }

    for (const decorationId in visitorInventory.decorations) {
      // Calculate availableQuantity as item.quantity minus the total placed decorations for all urlSlugs
      let placedCount = 0;
      const decorationName = visitorInventory.decorations[decorationId].name;
      const placedDecorationsForItem = visitorData.placedDecorations?.[decorationName];
      if (placedDecorationsForItem) {
        // Use Object.values and flatMap for better performance
        placedCount = Object.values(placedDecorationsForItem).reduce(
          (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
          0,
        );
      }
      let availableQuantity = (visitorInventory.decorations[decorationId].quantity || 0) - placedCount;

      // Check for placed decorations for this decorationName in this world
      // this should be updated to check for existence in all worlds once the endpoint is available
      const placedArr = placedDecorationsForItem?.[urlSlug];
      if (placedArr && placedArr.length > 0) {
        // Use Promise.allSettled for parallel existence checks
        const results = await Promise.allSettled(
          placedArr.map((droppedAssetId: string) =>
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
          delete visitorData.placedDecorations[decorationName];
        }
      }

      // Update availableQuantity in visitorInventory
      visitorInventory.decorations[decorationId].availableQuantity = availableQuantity;
    }

    return { visitor, visitorData, visitorInventory };
  } catch (error: any) {
    throw standardizeError(error);
  }
};
