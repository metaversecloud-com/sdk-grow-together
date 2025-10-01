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
 * Handle plant watering - grows plant by 1 level and updates dropped asset image in world
 */
export const handleWaterPlant = async (req: Request, res: Response) => {
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

    // Get seed configuration for harvest level and reward calculation
    const seedConfig = getSeedConfig(plant.seedId);
    if (!seedConfig) {
      return res.status(400).json({
        success: false,
        error: "Invalid plant type",
      });
    }

    const plantData = {
      ...plant,
      growLevel: plant.growLevel + 1,
      lastWatered: new Date().toISOString(),
    };

    // Update visitor's data object
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

    const updatedVisitorData = {
      ...visitorData,
      worlds: {
        ...visitorData.worlds,
        [urlSlug]: {
          ...visitorPlotData,
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
          analyticName: "plantWatered",
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
        console.error(`Failed to trigger water particle effect:`, error);
      });

    const plantAssetData = await plantAsset.fetchDataObject();

    // update the plant data on the asset
    await plantAsset.updateDataObject({ ...plantAssetData, ...plantData });

    // Update the plant asset image to reflect new growth level
    await plantAsset.updateWebImageLayers("", seedConfig.imageVariations[plant.growLevel + 1]).catch((error) => {
      console.error(`Failed to update plant asset ${assetId}:`, error);
    });

    return res.json({
      success: true,
      plantData,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleWaterPlant",
      message: "Error watering plant",
      req,
      res,
    });
  }
};
