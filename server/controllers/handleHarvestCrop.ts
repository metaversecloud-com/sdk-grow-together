import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  modifyVisitorInventoryItem,
  getAnalyticName,
  getInventoryItems,
  getCoinRewardAmount,
  getXpRewardAmount,
  getEarnedMessage,
  checkDidIncreaseLevelOrRank,
} from "../utils/index.js";
import { getSeedConfig } from "../../shared/index.js";

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


    const plotData = visitorData.worlds[urlSlug];

    // Check if the crop exists in visitor's data
    const crop = plotData.crops[assetId];
    if (!crop) throw "Crop not found";

    const { growLevel, squareId, appliedTools = [] } = crop;

    // Lock to prevent simultaneous harvests
    try {
      await visitor.updateDataObject(
        {},
        {
          lock: {
            lockId: `harvesting_${assetId}_${Math.round(Date.now() / 60000) * 60000}`,
          },
        },
      );
    } catch (error) {
      return res.status(409).json({ message: "Crop is already being harvest." });
    }

    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { ecosystemSeeds } = getInventoryItemsResponse;

    // Get seed configuration for harvest level and reward calculation
    const seedConfig = getSeedConfig(ecosystemSeeds, crop);
    if (!seedConfig) throw "Invalid crop type";

    // Check if crop is fully grown (at harvest level)
    if (growLevel < seedConfig.harvestLevel) {
      throw `Crop is not ready for harvest. Current growth level: ${growLevel}/${seedConfig.harvestLevel}`;
    }

    let cropAsset;
    try {
      cropAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    } catch (error) {
      console.error("Crop asset no longer in world. Continuing with harvest to clean up data object.");

      visitorData.worlds[urlSlug].plotSquares[squareId] = null;
      delete visitorData.worlds[urlSlug].crops[assetId];

      await visitor.updateDataObject(visitorData, {});

      return res.json({
        success: false,
        visitorData,
        plotData: visitorData.worlds[urlSlug],
        visitorInventory,
      });
    }

    // Grant coins and xp to visitor
    const xpRewardAmount = await getXpRewardAmount(seedConfig, "Harvest");
    const modifyXpResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: "Experience Points",
      quantity: xpRewardAmount,
    });
    if (modifyXpResponse instanceof Error) throw modifyXpResponse;

    const { coinsEarnedForRankUp, didLevelUp } = await checkDidIncreaseLevelOrRank(
      credentials,
      visitor,
      visitorInventory.xp,
      xpRewardAmount,
    );
    visitorInventory.xp = modifyXpResponse.quantity;

    let { coinRewardAmount, coinMultiplier } = getCoinRewardAmount(appliedTools, seedConfig.reward);
    coinRewardAmount += coinsEarnedForRankUp;
    const modifyCoinsResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: "Coins",
      quantity: coinRewardAmount,
    });
    if (modifyCoinsResponse instanceof Error) throw modifyCoinsResponse;
    visitorInventory.coins = modifyCoinsResponse.quantity;

    // Update visitor's data object
    const updatedVisitorData = {
      ...visitorData,
      totalCoinsEarned: visitorData.totalCoinsEarned + seedConfig.reward,
      lastDateCoinsEarned: new Date().toISOString(),
    };

    updatedVisitorData.worlds[urlSlug].plotSquares[squareId] = null;
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

    const earnedMessage = await getEarnedMessage(coinRewardAmount, xpRewardAmount, coinMultiplier);

    return res.json({
      success: true,
      visitorData: updatedVisitorData,
      plotData: updatedVisitorData.worlds[urlSlug],
      visitorInventory,
      earnedMessage,
      soundEffect: "harvest",
      didLevelUp,
    });
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
