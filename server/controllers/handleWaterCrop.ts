import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  getInventoryItems,
} from "../utils/index.js";
import { getSeedImageVariation } from "../../shared/index.js";
import { plotConfig } from "../../shared/constants/plotConfig.js";

/**
 * Handle crop watering - grows crop by 1 level and updates dropped asset image in world
 */
export const handleWaterCrop = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if the crop exists in visitor's data
    const crop = visitorPlotData.crops[assetId];
    if (!crop) throw "Crop not found";

    // Get seed configuration for harvest level and reward calculation
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { seeds } = getInventoryItemsResponse;

    const seedConfig = seeds[crop.seedId];
    if (!seedConfig) throw "Invalid crop type";

    const cropData = {
      ...crop,
      growLevel: crop.growLevel + 1,
      lastWatered: new Date().toISOString(),
    };

    // Update visitor's data object
    visitorData.worlds[urlSlug].crops[assetId] = cropData;

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "cropsWatered",
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
        {
          analyticName: `${seedConfig.name.toLowerCase()}Watered`,
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
        name: "drop_grow_together",
        duration: 1,
        position: {
          x: cropAsset.position.x - plotConfig.squareSpacing / 2,
          y: cropAsset.position.y - 200,
        },
      })
      .catch((error) => {
        console.error(`Failed to trigger water particle effect:`, error);
      });

    const cropAssetData = await cropAsset.fetchDataObject();

    // update the crop data on the asset
    await cropAsset.updateDataObject({ ...cropAssetData, ...cropData });

    // Update the crop asset image to reflect new growth level
    const layer1 = getSeedImageVariation(seedConfig.name, crop.growLevel + 1);
    await cropAsset.updateWebImageLayers("", layer1).catch((error) => {
      console.error(`Failed to update crop asset ${assetId}:`, error);
    });

    return res.json({
      success: true,
      cropData: { ...cropAssetData, ...cropData },
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleWaterCrop",
      message: "Error watering crop",
      req,
      res,
    });
  }
};
