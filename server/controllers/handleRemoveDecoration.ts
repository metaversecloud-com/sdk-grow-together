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
    const { assetId, profileId, urlSlug } = credentials;
    const { squareId } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    const plotData = visitorData.worlds[urlSlug];
    const decorationAssetId = plotData.plotSquares[squareId];

    if (!decorationAssetId) throw "No decoration found on the specified square";

    // Check if visitor owns this plot
    if (plotData.plotAssetId !== assetId) throw "You must own this plot before removing decorations";

    // Get decoration configuration
    const decoration = plotData.decorations[decorationAssetId];

    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { ecosystemDecorations } = getInventoryItemsResponse;

    const decorationConfig = ecosystemDecorations[decoration.decorationName];
    if (!decorationConfig) throw "Invalid decoration type";

    // Update visitor's data object
    visitorData.worlds[urlSlug].plotSquares[squareId] = null;
    delete visitorData.worlds[urlSlug].decorations[decorationAssetId];

    // Remove the placedDecoration entry
    if (visitorData.placedDecorations?.[decoration.decorationName]?.[urlSlug]) {
      const index = visitorData.placedDecorations[decoration.decorationName][urlSlug].indexOf(decorationAssetId);
      if (index > -1) {
        visitorData.placedDecorations[decoration.decorationName][urlSlug].splice(index, 1);
      }
    }
    // Only increment availableQuantity if it does not exceed quantity
    if (
      visitorInventory.decorations?.[decoration.decorationName]?.availableQuantity + 1 <=
      visitorInventory.decorations?.[decoration.decorationName]?.quantity
    ) {
      visitorInventory.decorations[decoration.decorationName].availableQuantity += 1;
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
      const droppedAsset = await DroppedAsset.get(decorationAssetId, urlSlug, {
        credentials: { ...credentials, assetId: decorationAssetId },
      });

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
        message: `Decoration asset with id '${decorationAssetId}' has already been removed from world.`,
      });
    }

    return res.json({
      success: true,
      visitorData,
      plotData: visitorData.worlds[urlSlug],
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
