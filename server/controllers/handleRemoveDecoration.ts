import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  getInventoryItems,
} from "../utils/index.js";

/**
 * Handle decoration removal - removes decoration from world and frees up the plot square
 */
export const handleRemoveDecoration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { squareId } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];
    const assetId = visitorPlotData.plotSquares[squareId];

    if (!assetId) throw "No decoration found on the specified square";

    // Get decoration configuration
    const decoration = visitorPlotData.decorations[assetId];

    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { decorations } = getInventoryItemsResponse;

    const decorationConfig = decorations[decoration.decorationId];
    if (!decorationConfig) throw "Invalid decoration type";

    // Update visitor's data object
    visitorData.worlds[urlSlug].plotSquares[squareId] = null;
    delete visitorData.worlds[urlSlug].decorations[assetId];

    // Remove the placedDecoration entry for this assetId
    if (visitorData.placedDecorations?.[decoration.decorationName]?.[urlSlug]) {
      const index = visitorData.placedDecorations[decoration.decorationName][urlSlug].indexOf(assetId);
      if (index > -1) {
        visitorData.placedDecorations[decoration.decorationName][urlSlug].splice(index, 1);
      }
    }
    // Only increment availableQuantity if it does not exceed quantity
    if (
      visitorInventory[decoration.decorationName].availableQuantity + 1 <=
      visitorInventory[decoration.decorationName].quantity
    ) {
      visitorInventory[decoration.decorationName].availableQuantity += 1;
    }

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "decorationsRemoved",
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
      ],
    });

    try {
      const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

      const world = World.create(urlSlug, { credentials });
      await world
        .triggerParticle({
          name: "dirt_grow_together",
          duration: 1,
          position: droppedAsset.position,
        })
        .catch((error) => {
          console.error(`Failed to trigger particle effect:`, error);
        });

      await droppedAsset.deleteDroppedAsset();
    } catch (error) {
      // Continue with removal even if asset deletion fails (it might have been manually removed from world)
      errorHandler({
        error,
        functionName: "handleRemoveDecoration",
        message: `Decoration asset with id '${assetId}' has already been removed from world.`,
      });
    }

    return res.json({
      success: true,
      visitorData,
      visitorPlotData: visitorData.worlds[urlSlug],
      visitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleRemoveDecoration",
      message: "Error removing decoration",
      req,
      res,
    });
  }
};
