import { Request, Response } from "express";
import {
  checkDidIncreaseLevelOrRank,
  errorHandler,
  getCredentials,
  getEarnedMessage,
  initializeVisitorData,
  modifyVisitorInventoryItem,
  waterCrop,
} from "../utils/index.js";

/**
 * Handle crop watering - grows crop by 1 level and updates dropped asset image in world
 */
export const handleWaterCrop = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { cropAssetId } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    const waterCropResult = await waterCrop({
      credentials,
      owner: visitor,
      ownerData: visitorData,
      assetId: cropAssetId || credentials.assetId,
      shouldReward: true,
    });
    if (waterCropResult instanceof Error) throw waterCropResult;

    let earnedMessage;
    const { xpRewardAmount, totalXp } = waterCropResult;
    if (totalXp) {
      const coinsEarnedForRankUp = await checkDidIncreaseLevelOrRank(
        credentials,
        visitor,
        visitorInventory.xp,
        xpRewardAmount,
      );
      visitorInventory.xp = totalXp;

      if (coinsEarnedForRankUp > 0) {
        const modifyCoinsResponse = await modifyVisitorInventoryItem({
          credentials,
          visitor,
          name: "Coins",
          quantity: coinsEarnedForRankUp,
        });
        if (modifyCoinsResponse instanceof Error) throw modifyCoinsResponse;
        visitorInventory.coins = modifyCoinsResponse.quantity;
      }

      if (xpRewardAmount) earnedMessage = await getEarnedMessage(coinsEarnedForRankUp, xpRewardAmount);
    }

    return res.json({ ...waterCropResult, visitorInventory, earnedMessage });
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
