import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  getInventoryItems,
  getAnalyticName,
} from "../utils/index.js";
import { CropDataObjectType, getSeedImageVariation } from "../../shared/index.js";
import { plotConfig } from "../../shared/constants/plotConfig.js";

/**
 * Handle crop watering - grows crop by 1 level and updates dropped asset image in world
 */
export const handleWaterCrop = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { cropAssetId } = req.body;
    const assetId = cropAssetId || credentials.assetId;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if the crop exists in visitor's data
    const crop = visitorPlotData.crops[assetId];
    if (!crop) throw "Crop not found";

    // Lock to prevent simultaneous waterings
    try {
      await visitor.updateDataObject(
        {},
        {
          lock: {
            lockId: `planting_${cropAssetId}_${Math.round(Date.now() / 30000) * 30000}`,
          },
        },
      );
    } catch (error) {
      return res.status(409).json({ message: "Crop is already being watered." });
    }

    // Get seed configuration for harvest level and reward calculation
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { seeds } = getInventoryItemsResponse;

    const seedConfig = seeds[crop.seedId];
    if (!seedConfig) throw "Invalid crop type";

    if (crop.growLevel >= seedConfig.harvestLevel) throw "Crop is already fully grown";

    try {
      const cropAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

      const cropData = {
        ...crop,
        growLevel: crop.growLevel + 1,
        lastWatered: new Date().toISOString(),
      };

      // Update visitor's data object
      visitorData.worlds[urlSlug].crops[assetId] = cropData;

      const world = World.create(urlSlug, { credentials });

      await Promise.all([
        visitor.updateDataObject(visitorData, {
          analytics: [
            {
              analyticName: "cropsWatered",
              profileId,
              urlSlug,
              uniqueKey: profileId,
            },
            {
              analyticName: `${getAnalyticName(seedConfig)}Watered`,
              profileId,
              urlSlug,
              uniqueKey: profileId,
            },
          ],
        }),
        world
          .triggerParticle({
            name: "drop_grow_together",
            duration: 1,
            position: {
              x: cropAsset.position.x - plotConfig.squareSpacing / 2,
              y: cropAsset.position.y - 200,
            },
          })
          .catch((error) => {
            errorHandler({
              error,
              functionName: "handleWaterCrop",
              message: `Failed to trigger water particle effect: ${error}`,
            });
          }),
        cropAsset.fetchDataObject(),
      ]);

      const cropAssetData = cropAsset.dataObject as CropDataObjectType;

      // update the crop data on the asset
      await cropAsset.updateDataObject({ ...cropAssetData, ...cropData });

      // Update the crop asset image to reflect new growth level
      const layer1 = getSeedImageVariation(seedConfig.name, crop.growLevel + 1);
      await cropAsset.updateWebImageLayers("", layer1).catch((error) => {
        errorHandler({
          error,
          functionName: "handleWaterCrop",
          message: `Failed to update crop asset ${assetId}: ${error}`,
        });
      });

      return res.json({
        success: true,
        cropData: { ...cropAssetData, ...cropData },
        visitorData,
        visitorPlotData: visitorData.worlds[urlSlug],
      });
    } catch (error) {
      console.error("Crop asset no longer in world. Continuing to clean up data object.");

      visitorData.worlds[urlSlug].plotSquares[crop.squareId] = null;
      delete visitorData.worlds[urlSlug].crops[assetId];

      await visitor.updateDataObject(visitorData, {});

      return res.json({
        success: false,
        visitorData,
        visitorPlotData: visitorData.worlds[urlSlug],
      });
    }
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
