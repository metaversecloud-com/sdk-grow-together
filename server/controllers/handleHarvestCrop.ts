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
    const { profileId, urlSlug } = credentials;
    const { cropAssetId } = req.body;
    const assetId = cropAssetId || credentials.assetId;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if the crop exists in visitor's data
    const crop = visitorPlotData.crops[assetId];
    if (!crop) throw "Crop not found";

    // Lock to prevent simultaneous harvests
    try {
      await visitor.updateDataObject(
        {},
        {
          lock: {
            lockId: `planting_${assetId}_${cropAssetId}_${Math.round(Date.now() / 60000) * 60000}`,
          },
        },
      );
    } catch (error) {
      return res.status(409).json({ message: "Crop is already being harvest." });
    }

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

    try {
      const cropAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

      // Grant coins to visitor (modify quantity or add to inventory)
      if (cropAsset) {
        const name = "Coins";
        const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
          credentials,
          visitor,
          name,
          quantity: seedConfig.reward,
        });
        if (modifyInventoryItemResponse instanceof Error) throw modifyInventoryItemResponse;
        visitorInventory[name] = { id: name, quantity: modifyInventoryItemResponse };
      }

      // Update visitor's data object
      const updatedVisitorData = {
        ...visitorData,
        totalCoinsEarned: visitorData.totalCoinsEarned + seedConfig.reward,
        lastDateCoinsEarned: new Date().toISOString(),
      };

      updatedVisitorData.worlds[urlSlug].plotSquares[crop.squareId] = null;
      delete updatedVisitorData.worlds[urlSlug].crops[assetId];

      const world = World.create(urlSlug, { credentials });

      await Promise.all([
        visitor.updateDataObject(updatedVisitorData, {
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
        }),
        world
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
          }),
      ]);

      // Remove the crop asset from the world
      await cropAsset.deleteDroppedAsset().catch((error) => {
        errorHandler({
          error,
          functionName: "handleHarvestCrop",
          message: `Failed to delete crop asset ${assetId}: ${error}`,
        });
      });

      return res.json({
        success: true,
        visitorData: updatedVisitorData,
        visitorPlotData: updatedVisitorData.worlds[urlSlug],
        visitorInventory,
      });
    } catch (error) {
      console.error("Crop asset no longer in world. Continuing with harvest to clean up data object.");

      visitorData.worlds[urlSlug].plotSquares[crop.squareId] = null;
      delete visitorData.worlds[urlSlug].crops[assetId];

      await visitor.updateDataObject(visitorData, {});

      return res.json({
        success: false,
        visitorData,
        visitorPlotData: visitorData.worlds[urlSlug],
        visitorInventory,
      });
    }
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
