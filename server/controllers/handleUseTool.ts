import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  User,
  modifyVisitorInventoryItem,
  DroppedAsset,
  waterCrop,
  getEarnedMessage,
  checkDidIncreaseLevelOrRank,
} from "../utils/index.js";
import { VisitorDataObjectType } from "../../shared/index.js";

/**
 * Handle using a tool on a crop (e.g., watering with a watering can)
 * May be used for decorations in the future
 */
export const handleUseTool = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { itemAssetId, tool, ownerId } = req.body;
    const assetId = itemAssetId || credentials.assetId;

    if (!tool) throw "A selected tool is required";

    const { actionType, name } = tool;
    let earnedMessage,
      didLevelUp = false;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    let owner, ownerData, plotData, result;
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

    if (actionType === "Water") {
      result = await waterCrop({
        credentials,
        owner,
        ownerData,
        assetId,
      });
      if (result instanceof Error) throw result;

      // Determine coinReward and xpReward based on tool name
      let coinReward = 0;
      let xpReward = 0;
      if (name === "Wooden Watering Can") {
        xpReward = Math.floor(Math.random() * 2) + 1; // 1-2 XP
        if (Math.random() < 0.25) {
          coinReward = Math.floor(Math.random() * 3) + 1; // 1-3 coins
        }
      } else if (name === "Metal Watering Can") {
        xpReward = Math.floor(Math.random() * 4) + 3; // 3-6 XP
        if (Math.random() < 0.5) {
          coinReward = Math.floor(Math.random() * 5) + 4; // 4-8 coins
        }
      } else if (name === "Gold Watering Can") {
        xpReward = Math.floor(Math.random() * 8) + 7; // 7-14 XP
        if (Math.random() < 0.8) {
          coinReward = Math.floor(Math.random() * 11) + 10; // 10-20 coins
        }
      }

      // Grant coins and xp to visitor if applicable
      let coinsEarnedForRankUp = 0;
      if (xpReward > 0) {
        const modifyXpResponse = await modifyVisitorInventoryItem({
          credentials,
          visitor,
          name: "Experience Points",
          quantity: xpReward,
        });
        if (modifyXpResponse instanceof Error) throw modifyXpResponse;

        const checkResult = await checkDidIncreaseLevelOrRank(credentials, visitor, visitorInventory.xp, xpReward);
        coinsEarnedForRankUp = checkResult.coinsEarnedForRankUp;
        didLevelUp = checkResult.didLevelUp;

        visitorInventory.xp = modifyXpResponse.quantity;
      }

      coinReward += coinsEarnedForRankUp;
      if (coinReward > 0) {
        const modifyCoinsResponse = await modifyVisitorInventoryItem({
          credentials,
          visitor,
          name: "Coins",
          quantity: coinReward,
        });
        if (modifyCoinsResponse instanceof Error) throw modifyCoinsResponse;
        visitorInventory.coins = modifyCoinsResponse.quantity;
      }

      earnedMessage = await getEarnedMessage(coinReward, xpReward);
    } else {
      const cropAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
      await cropAsset.fetchDataObject();
      let cropData = cropAsset.dataObject;

      const appliedTools = plotData.crops[assetId]?.appliedTools || [];
      if (appliedTools.length >= 3) {
        throw "Maximum number of tools has already applied to this crop.";
      } else {
        appliedTools.push(name);
        ownerData.worlds[urlSlug].crops[assetId].appliedTools = appliedTools;

        cropData = { ...cropAsset.dataObject, ...ownerData.worlds[urlSlug].crops[assetId] };

        const lockId = `applyingTool_${assetId}_${Math.round(Date.now() / 10000) * 10000}`;
        await Promise.all([
          owner.updateDataObject(ownerData, {
            lock: { lockId, releaseLock: true },
          }),
          cropAsset.updateDataObject(cropData, {
            lock: { lockId, releaseLock: true },
          }),
        ]);
      }

      result = {
        success: true,
        cropData,
        visitorData: ownerData,
        plotData: ownerData.worlds[urlSlug],
      };
    }

    if (result?.success) {
      // Remove one tool from visitor's inventory
      modifyVisitorInventoryItem({
        credentials,
        visitor,
        name,
        quantity: -1,
      });
      visitorInventory.tools[name].availableQuantity -= 1;
      visitorInventory.tools[name].quantity -= 1;
    }

    return res.json({ ...result, visitorInventory, earnedMessage, soundEffect: actionType.toLowerCase(), didLevelUp });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUseTool",
      message: "Error using tool",
      req,
      res,
    });
  }
};
