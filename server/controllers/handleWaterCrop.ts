import { Request, Response } from "express";
import { errorHandler, getCredentials, getEarnedMessage, initializeVisitorData, waterCrop } from "../utils/index.js";

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

    const { xpRewardAmount, totalXp } = waterCropResult;
    if (totalXp) visitorInventory.xp = totalXp;

    let earnedMessage;
    if (xpRewardAmount) earnedMessage = await getEarnedMessage(0, xpRewardAmount);

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
