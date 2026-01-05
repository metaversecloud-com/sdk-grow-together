import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  getInventoryItems,
  User,
  modifyVisitorInventoryItem,
} from "../utils/index.js";
import { CropDataObjectType, getSeedImageVariation, VisitorDataObjectType, plotConfig } from "../../shared/index.js";

/**
 * Handle using a tool on an entire plot (e.g., watering all crops with a sprinkler)
 */
export const handleUsePlotTool = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;
    const { tool, ownerId } = req.body;

    const { name, reward, xp, actionType } = tool;
    const promises = [];

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    let owner, ownerData, plotData;
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

    // Lock to prevent simultaneous plot tool usage
    try {
      await owner.updateDataObject(
        {},
        {
          lock: {
            lockId: `usingPlotTool_${assetId}_${Math.round(Date.now() / 30000) * 30000}`,
          },
        },
      );
    } catch (error) {
      return res.status(409).json({ message: "Plot is already being updated." });
    }

    // Get seed configuration for harvest level and reward calculation
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { seeds } = getInventoryItemsResponse;

    const updateCropAssetPromises = [];
    const updateWebImageLayerPromises = [];
    const triggerParticlePromises = [];
    const modifyInventoryPromises = [];
    const cropsToRemove: string[] = [];
    const now = new Date().toISOString();
    const world = World.create(urlSlug, { credentials });

    for (const assetId in plotData.crops) {
      const crop = plotData.crops[assetId];
      const seedConfig = seeds[crop?.seedId];

      if (
        crop &&
        seedConfig &&
        ((actionType === "Water" && crop.growLevel < seedConfig.harvestLevel) ||
          (actionType === "Harvest" && crop.growLevel >= seedConfig.harvestLevel))
      ) {
        let cropAsset;
        try {
          cropAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
          await cropAsset.fetchDataObject();
        } catch (error) {
          console.error("Crop asset no longer in world. Continuing to clean up data object.");
          visitorData.worlds[urlSlug].plotSquares[crop.squareId] = null;
          cropsToRemove.push(assetId);
          continue;
        }

        if (actionType === "Water") {
          const cropData = {
            ...crop,
            growLevel: crop.growLevel + 1,
            lastWatered: now,
          };
          const cropAssetData = cropAsset.dataObject as CropDataObjectType;
          visitorData.worlds[urlSlug].crops[assetId] = cropData;

          const layer1 = getSeedImageVariation(seedConfig.name, crop.growLevel + 1);

          // Batch update promises
          updateCropAssetPromises.push(cropAsset.updateDataObject({ ...cropAssetData, ...cropData }));
          updateWebImageLayerPromises.push(
            cropAsset.updateWebImageLayers("", layer1).catch((error) => {
              errorHandler({
                error,
                functionName: "handleWaterCrop",
                message: `Failed to update crop asset ${assetId}: ${error}`,
              });
            }),
          );
          triggerParticlePromises.push(
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
          );
        } else if (actionType === "Harvest") {
          // Grant coins and xp to visitor (modify quantity or add to inventory)
          modifyInventoryPromises.push(
            modifyVisitorInventoryItem({
              credentials,
              visitor,
              name: "Coins",
              quantity: seedConfig.reward,
            }),
          );
          modifyInventoryPromises.push(
            modifyVisitorInventoryItem({
              credentials,
              visitor,
              name: "Experience Points",
              quantity: seedConfig.xp,
            }),
          );

          // Update visitor's data object
          visitorData.totalCoinsEarned = visitorData.totalCoinsEarned + seedConfig.reward;
          visitorData.lastDateCoinsEarned = now;
          visitorData.worlds[urlSlug].plotSquares[crop.squareId] = null;

          triggerParticlePromises.push(
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
          );

          // Remove the crop asset from the world
          cropsToRemove.push(assetId);
        }
      }
    }

    // Remove one tool from visitor's inventory
    modifyInventoryPromises.push(
      modifyVisitorInventoryItem({
        credentials,
        visitor,
        name,
        quantity: -1,
      }),
    );

    // Remove crops that are no longer in the world
    const uniqueCropsToRemove = [...new Set(cropsToRemove)];
    for (const assetId of uniqueCropsToRemove) delete visitorData.worlds[urlSlug].crops[assetId];

    // Only one updateDataObject for all crops
    promises.push(visitor.updateDataObject(visitorData, {}));
    promises.push(Promise.all(updateCropAssetPromises));
    promises.push(Promise.all(updateWebImageLayerPromises));
    promises.push(Promise.all(triggerParticlePromises));
    promises.push(Promise.all(modifyInventoryPromises));

    await Promise.all(promises);

    const refetchVisitorDataResponse = await initializeVisitorData(credentials);
    if (refetchVisitorDataResponse instanceof Error) throw refetchVisitorDataResponse;

    const { visitorInventory } = refetchVisitorDataResponse;

    if (actionType === "Harvest") {
      await World.deleteDroppedAssets(urlSlug, uniqueCropsToRemove, process.env.INTERACTIVE_SECRET!, credentials);
    }

    return res.json({
      success: false,
      visitorData: ownerData,
      plotData: ownerData.worlds[urlSlug],
      visitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUsePlotTool",
      message: "Error using plot tool",
      req,
      res,
    });
  }
};
