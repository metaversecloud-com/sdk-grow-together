import { Request, Response } from "express";
import { errorHandler, getCredentials, initializeVisitorData, DroppedAsset, World } from "../utils/index.js";
import { seeds } from "../../shared/index.js";

/**
 * Handle plant harvesting - removes plant from world and awards coins
 */
export const handleHarvestPlant = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if the plant exists in visitor's data
    const plant = visitorPlotData.plants[assetId];
    if (!plant) throw "Plant not found";

    // Get seed configuration for harvest level and reward calculation
    const seedConfig = seeds[plant.seedId];
    if (!seedConfig) throw "Invalid plant type";

    // Check if plant is fully grown (at harvest level)
    if (plant.growLevel < seedConfig.harvestLevel) {
      throw `Plant is not ready for harvest. Current growth level: ${plant.growLevel}/${seedConfig.harvestLevel}`;
    }

    // Update visitor's data object
    const updatedVisitorData = {
      ...visitorData,
      coinsAvailable: visitorData.coinsAvailable + seedConfig.reward,
      totalCoinsEarned: visitorData.totalCoinsEarned + seedConfig.reward,
      lastDateCoinsEarned: new Date().toISOString(),
    };

    updatedVisitorData.worlds[urlSlug].plotSquares[plant.squareIndex] = null;
    delete updatedVisitorData.worlds[urlSlug].plants[assetId];

    await visitor.updateDataObject(updatedVisitorData, {
      analytics: [
        {
          analyticName: "plantHarvested",
          profileId,
          urlSlug,
          uniqueKey: profileId,
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
