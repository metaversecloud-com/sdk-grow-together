import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  modifyVisitorInventoryItem,
  getInventoryItems,
  getAnalyticName,
} from "../utils/index.js";

/**
 * Handle crop harvesting - removes crop from world and awards coins
 */
export const handleHarvestCrop = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if the crop exists in visitor's data
    const crop = visitorPlotData.crops[assetId];
    if (!crop) throw "Crop not found";

    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { seeds } = getInventoryItemsResponse;

    // Get seed configuration for harvest level and reward calculation
    const seedConfig = seeds[crop.seedId];
    if (!seedConfig) throw "Invalid crop type";

    // Check if crop is fully grown (at harvest level)
    if (crop.growLevel < seedConfig.harvestLevel) {
      throw `Crop is not ready for harvest. Current growth level: ${crop.growLevel}/${seedConfig.harvestLevel}`;
    }

    // Grant coins to visitor (modify quantity or add to inventory)
    const name = "Coins";
    const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name,
      quantity: seedConfig.reward,
    });
    if (modifyInventoryItemResponse instanceof Error) throw modifyInventoryItemResponse;
    visitorInventory[name] = { id: name, quantity: modifyInventoryItemResponse };

    // Update visitor's data object
    const updatedVisitorData = {
      ...visitorData,
      totalCoinsEarned: visitorData.totalCoinsEarned + seedConfig.reward,
      lastDateCoinsEarned: new Date().toISOString(),
    };

    updatedVisitorData.worlds[urlSlug].plotSquares[crop.squareId] = null;
    delete updatedVisitorData.worlds[urlSlug].crops[assetId];

    await visitor.updateDataObject(updatedVisitorData, {
      analytics: [
        {
          analyticName: "cropsHarvested",
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
        {
          analyticName: `${getAnalyticName(seedConfig)}Harvested`,
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
      ],
    });

    const cropAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    // Trigger particle effect at crop position (if we can still get the asset)
    const world = World.create(urlSlug, { credentials });
    await world
      .triggerParticle({
        name: "coin_grow_together",
        duration: 2,
        position: cropAsset.position,
      })
      .catch((error) => {
        errorHandler({
          error,
          functionName: "handleHarvestCrop",
          message: `Failed to trigger harvest particle effect: ${error}`,
        });
      });

    // Remove the crop asset from the world
    await cropAsset.deleteDroppedAsset().catch((error) => {
      errorHandler({
        error,
        functionName: "handleHarvestCrop",
        message: `Failed to delete crop asset ${assetId}: ${error}`,
      });
      // Continue with harvest even if asset deletion fails (it might have been manually deleted)
    });

    return res.json({
      success: true,
      visitorData: updatedVisitorData,
      visitorPlotData: updatedVisitorData.worlds[urlSlug],
      visitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleHarvestCrop",
      message: "Error harvesting crop",
      req,
      res,
    });
  }
};
