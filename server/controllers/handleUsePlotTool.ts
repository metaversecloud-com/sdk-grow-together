import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  getInventoryItems,
  getCoinRewardAmount,
  getXpRewardAmount,
  User,
  modifyVisitorInventoryItem,
  getEarnedMessage,
  getVisitorInventory,
  checkDidIncreaseLevelOrRank,
} from "../utils/index.js";
import { CropDataObjectType, getSeedImageVariation, VisitorDataObjectType, plotConfig } from "../../shared/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

/**
 * Handle using a tool on an entire plot (e.g., watering all crops with a sprinkler)
 */
export const handleUsePlotTool = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;
    const { tool, ownerId } = req.body;

    const { actionType, name } = tool;
    const promises = [];
    let totalCoinsRewardAmount = 0,
      totalXpRewardAmount = 0,
      soundEffect = "sprinkler";

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

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

    const getDroppedAssetPromises = [];
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
        getDroppedAssetPromises.push(
          DroppedAsset.get(assetId, urlSlug, { credentials }).catch(() => {
            console.error("Crop asset no longer in world. Continuing to clean up data object.");
            ownerData.worlds[urlSlug].plotSquares[crop.squareId] = null;
            cropsToRemove.push(assetId);
          }),
        );
      }
    }

    const droppedAssets = await Promise.all(getDroppedAssetPromises);

    for (let i = 0; i < droppedAssets.length; i++) {
      const cropAsset = droppedAssets[i] as DroppedAssetInterface;
      if (!cropAsset || !cropAsset.id) continue;

      const crop = plotData.crops[cropAsset.id];
      const seedConfig = seeds[crop.seedId];

      const xpRewardAmount = await getXpRewardAmount(seedConfig, actionType);
      totalXpRewardAmount += xpRewardAmount;

      if (actionType === "Water") {
        const cropData = {
          ...crop,
          growLevel: crop.growLevel + 1,
          lastWatered: now,
        };
        const cropAssetData = cropAsset.dataObject as CropDataObjectType;
        ownerData.worlds[urlSlug].crops[cropAsset.id] = cropData;

        const layer1 = getSeedImageVariation(seedConfig.name, crop.growLevel + 1);

        // Batch update promises
        updateCropAssetPromises.push(cropAsset.updateDataObject({ ...cropAssetData, ...cropData }, {}));
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
        const { coinRewardAmount } = getCoinRewardAmount(crop.appliedTools, seedConfig.reward);
        totalCoinsRewardAmount += coinRewardAmount;

        ownerData.worlds[urlSlug].plotSquares[crop.squareId] = null;

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
        cropsToRemove.push(cropAsset.id);
      }
    }

    // Grant xp to visitor
    if (totalXpRewardAmount > 0) {
      modifyInventoryPromises.push(
        modifyVisitorInventoryItem({
          credentials,
          visitor,
          name: "Experience Points",
          quantity: totalXpRewardAmount,
        }),
      );
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
    visitorInventory.tools[name].availableQuantity -= 1;
    visitorInventory.tools[name].quantity -= 1;

    // Remove crops that are no longer in the world
    const uniqueCropsToRemove = [...new Set(cropsToRemove)];
    for (const assetId of uniqueCropsToRemove) delete ownerData.worlds[urlSlug].crops[assetId];

    // Only one updateDataObject for all crops
    promises.push(Promise.all(updateCropAssetPromises));
    promises.push(Promise.all(updateWebImageLayerPromises));
    promises.push(Promise.all(triggerParticlePromises));
    promises.push(Promise.all(modifyInventoryPromises));

    await Promise.all(promises);

    // get updated visitor inventory and check for level/rank up
    const getVisitorInventoryResponse = await getVisitorInventory(credentials);
    if (getVisitorInventoryResponse instanceof Error) throw getVisitorInventoryResponse;

    const updatedVisitorInventory = getVisitorInventoryResponse;

    const { coinsEarnedForRankUp, didLevelUp } = await checkDidIncreaseLevelOrRank(
      credentials,
      visitor,
      visitorInventory.xp,
      totalXpRewardAmount,
    );
    totalCoinsRewardAmount += coinsEarnedForRankUp;

    if (totalCoinsRewardAmount > 0) {
      const modifyCoinsResponse = await modifyVisitorInventoryItem({
        credentials,
        visitor,
        name: "Coins",
        quantity: totalCoinsRewardAmount,
      });
      if (modifyCoinsResponse instanceof Error) throw modifyCoinsResponse;
      updatedVisitorInventory.coins = modifyCoinsResponse.quantity;
    }

    // Update visitor's data object
    ownerData.totalCoinsEarned = ownerData.totalCoinsEarned + totalCoinsRewardAmount;
    ownerData.lastDateCoinsEarned = now;
    await visitor.updateDataObject(ownerData, {});

    if (actionType === "Harvest") {
      soundEffect = "harvest";

      await World.deleteDroppedAssets(urlSlug, uniqueCropsToRemove, process.env.INTERACTIVE_SECRET!, credentials);
    }

    const earnedMessage = await getEarnedMessage(totalCoinsRewardAmount, totalXpRewardAmount);

    return res.json({
      success: false,
      visitorData: ownerData,
      plotData: ownerData.worlds[urlSlug],
      visitorInventory: updatedVisitorInventory,
      earnedMessage,
      soundEffect,
      didLevelUp,
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
