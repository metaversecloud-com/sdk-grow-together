import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  getInventoryItems,
  getAnalyticName,
  User,
  modifyVisitorInventoryItem,
} from "../utils/index.js";
import { CropDataObjectType, getSeedImageVariation, VisitorDataObjectType } from "../../shared/index.js";

/**
 * Handle using a tool on a crop (e.g., watering with a watering can)
 * May be used for decorations in the future
 */
export const handleUseTool = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { itemAssetId, squareId, toolName, ownerId } = req.body;
    const assetId = itemAssetId || credentials.assetId;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    let owner, ownerData, plotData, crop;
    if (profileId === ownerId) {
      owner = visitor;
      ownerData = visitorData;
      plotData = visitorData.worlds[urlSlug];
    } else {
      owner = await User.create({ credentials, profileId: ownerId });
      ownerData = (await owner.fetchDataObject()) as VisitorDataObjectType;
      plotData = ownerData.worlds[urlSlug];
    }

    if (!owner) throw "Visitor or User (plot owner) not found";

    crop = plotData.crops[assetId];
    if (!crop) throw "Crop not found";

    // Lock to prevent simultaneous waterings
    try {
      await owner.updateDataObject(
        {},
        {
          lock: {
            lockId: `planting_${assetId}_${Math.round(Date.now() / 30000) * 30000}`,
          },
        },
      );
    } catch (error) {
      return res.status(409).json({ message: "Crop is already being updated." });
    }

    // Get ecosystem inventory items to access seed configurations
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { seeds } = getInventoryItemsResponse;

    const seedConfig = seeds[crop.seedId];
    if (!seedConfig) throw "Invalid crop type";

    const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: toolName,
      quantity: -1,
    });
    if (modifyInventoryItemResponse instanceof Error) throw modifyInventoryItemResponse;

    const availableQuantity = visitorInventory.tools[toolName]?.availableQuantity || 0;
    visitorInventory.tools[toolName] = modifyInventoryItemResponse;
    visitorInventory.tools[toolName].availableQuantity = availableQuantity - 1;

    return res.json({
      success: false,
      visitorData: ownerData,
      visitorPlotData: ownerData.worlds[urlSlug],
      visitorInventory,
    });

    /* need to figure out how to apply tool effects before enabling this (below would work for basic watering)
    try {
      const cropAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

      const cropData = {
        ...crop,
        growLevel: crop.growLevel + 1,
        lastWatered: new Date().toISOString(),
      };

      // Update owner's data object
      ownerData.worlds[urlSlug].crops[assetId] = cropData;

      const world = World.create(urlSlug, { credentials });

      await Promise.all([
        owner.updateDataObject(ownerData, {
          // analytics: [
          //   {
          //     analyticName: "cropsWatered",
          //     profileId,
          //     urlSlug,
          //     uniqueKey: profileId,
          //   },
          //   {
          //     analyticName: `${getAnalyticName(seedConfig)}Watered`,
          //     profileId,
          //     urlSlug,
          //     uniqueKey: profileId,
          //   },
          // ],
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
              functionName: "handleUseTool",
              message: `Failed to trigger particle effect: ${error}`,
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
        visitorData: ownerData,
        visitorPlotData: ownerData.worlds[urlSlug],
      });
    } catch (error) {
      console.error("Crop asset no longer in world. Continuing to clean up data object.");

      ownerData.worlds[urlSlug].plotSquares[crop.squareId] = null;
      delete ownerData.worlds[urlSlug].crops[assetId];

      await owner.updateDataObject(ownerData, {});

      return res.json({
        success: false,
        visitorData: ownerData,
        visitorPlotData: ownerData.worlds[urlSlug],
      });
    }
    */
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
