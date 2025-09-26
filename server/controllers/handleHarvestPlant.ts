import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  getSeedConfig,
  Visitor,
  DroppedAsset,
  World,
} from "../utils/index.js";

/**
 * Handle plant harvesting - removes plant from world and awards coins
 */
export const handleHarvestPlant = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId } = credentials;
    const { droppedAssetId } = req.body;

    if (!droppedAssetId || typeof droppedAssetId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Valid droppedAssetId is required",
      });
    }

    // Initialize visitor data
    const visitorData = await initializeVisitorData(credentials);

    // Check if the plant exists in visitor's data
    const plant = visitorData.plants[droppedAssetId];
    if (!plant) {
      return res.status(400).json({
        success: false,
        error: "Plant not found",
      });
    }

    // Check if plant was already harvested
    if (plant.wasHarvested) {
      return res.status(400).json({
        success: false,
        error: "Plant already harvested",
      });
    }

    // Get seed configuration for harvest level and reward calculation
    const seedConfig = getSeedConfig(plant.seedId);
    if (!seedConfig) {
      return res.status(400).json({
        success: false,
        error: "Invalid plant type",
      });
    }

    // Check if plant is fully grown (at harvest level)
    if (plant.growLevel < seedConfig.harvestLevel) {
      return res.status(400).json({
        success: false,
        error: `Plant is not ready for harvest. Current growth level: ${plant.growLevel}/${seedConfig.harvestLevel}`,
      });
    }

    // Update visitor's data object
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    const updatedVisitorData = {
      ...visitorData,
      coinsAvailable: visitorData.coinsAvailable + seedConfig.reward,
      totalCoinsEarned: visitorData.totalCoinsEarned + seedConfig.reward,
      ownedPlot: visitorData.ownedPlot
        ? {
            ...visitorData.ownedPlot,
            plotSquares: {
              ...visitorData.ownedPlot.plotSquares,
              [plant.squareIndex]: null, // Free up the square
            },
          }
        : null,
      plants: {
        ...visitorData.plants,
        [droppedAssetId]: {
          ...plant,
          wasHarvested: true,
        },
      },
    };

    await visitor.updateDataObject(
      { [urlSlug]: updatedVisitorData },
      {
        analytics: [
          {
            analyticName: "plant_harvested",
          },
        ],
      },
    );

    // Trigger particle effect at plant position (if we can still get the asset)
    try {
      const plantAsset = await DroppedAsset.get(droppedAssetId, urlSlug, { credentials });
      const world = World.create(urlSlug, { credentials });
      await world.triggerParticle({
        name: "Sparkle",
        duration: 2,
        position: plantAsset.position,
      });
    } catch (error) {
      console.error(`Failed to trigger harvest particle effect:`, error);
    }

    try {
      // Remove the plant asset from the world
      const plantAsset = await DroppedAsset.get(droppedAssetId, urlSlug, { credentials });
      await plantAsset.deleteDroppedAsset();
    } catch (error) {
      console.error(`Failed to delete plant asset ${droppedAssetId}:`, error);
      // Continue with harvest even if asset deletion fails (it might have been manually deleted)
    }

    return res.json({
      success: true,
      coinsEarned: seedConfig.reward,
      totalCoins: updatedVisitorData.coinsAvailable,
      visitorData: updatedVisitorData,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleHarvestPlant",
      message: "Error harvesting plant",
      req,
      res,
    });
  }
};
