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
    const { assetId, urlSlug, visitorId } = credentials;

    // Initialize visitor data
    const visitorData = await initializeVisitorData(credentials);
    if (visitorData instanceof Error) throw visitorData;

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if the plant exists in visitor's data
    const plant = visitorPlotData.plants[assetId];
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

    const plantData = {
      ...plant,
      wasHarvested: true,
    };

    // Update visitor's data object
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

    const updatedVisitorData = {
      ...visitorData,
      coinsAvailable: visitorData.coinsAvailable + seedConfig.reward,
      totalCoinsEarned: visitorData.totalCoinsEarned + seedConfig.reward,
      lastDateCoinsEarned: new Date().toISOString(),
      worlds: {
        ...visitorData.worlds,
        [urlSlug]: {
          ownedPlot: visitorPlotData.ownedPlot
            ? {
                ...visitorPlotData.ownedPlot,
                plotSquares: {
                  ...visitorPlotData.ownedPlot.plotSquares,
                  [plant.squareIndex]: null, // Free up the square
                },
              }
            : null,
          plants: {
            ...visitorPlotData.plants,
            [assetId]: plantData,
          },
        },
      },
    };

    await visitor.updateDataObject(updatedVisitorData, {
      analytics: [
        {
          analyticName: "plantHarvested",
        },
      ],
    });

    const plantAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    // Trigger particle effect at plant position (if we can still get the asset)
    const world = World.create(urlSlug, { credentials });
    await world
      .triggerParticle({
        name: "lightBlueSmoke_puff",
        duration: 2,
        position: plantAsset.position,
      })
      .catch((error) => {
        console.error(`Failed to trigger harvest particle effect:`, error);
      });

    // Remove the plant asset from the world
    await plantAsset.deleteDroppedAsset().catch((error) => {
      console.error(`Failed to delete plant asset ${assetId}:`, error);
      // Continue with harvest even if asset deletion fails (it might have been manually deleted)
    });

    return res.json({
      success: true,
      plantData,
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
