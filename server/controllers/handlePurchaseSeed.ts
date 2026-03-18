import { Request, Response } from "express";
import { AxiosError } from "axios";
import {
  errorHandler,
  getAnalyticName,
  getCredentials,
  getInventoryItems,
  initializeVisitorData,
  modifyVisitorInventoryItem,
} from "../utils/index.js";

/**
 * Handle seed purchase - allows visitor to purchase seeds with coins
 */
export const handlePurchaseSeed = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { seedId } = req.body;

    if (!seedId) throw "Valid seedId is required";

    // Get seed configuration
    const { ecosystemSeeds } = await getInventoryItems(credentials);

    const seedConfig = ecosystemSeeds[seedId];
    if (!seedConfig) throw "Invalid seed type";

    const { visitor, visitorInventory } = await initializeVisitorData(credentials);

    // Check if seed is already purchased (for paid seeds)
    if (seedConfig.cost > 0 && visitorInventory.seeds[seedId]) throw "Seed already purchased";

    // Check if visitor has enough coins
    if (visitorInventory.coins < seedConfig.cost) {
      throw `Not enough coins. Need ${seedConfig.cost}, have ${visitorInventory.coins}`;
    }

    // Purchase the seed (modify quantity in inventory)
    const modifyCoinsResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: "Coins",
      quantity: -seedConfig.cost,
    });
    visitorInventory.coins = modifyCoinsResponse.quantity;

    const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      id: seedId,
      quantity: 1,
    });

    visitorInventory.seeds[seedId] = {
      ...visitorInventory.seeds[seedId],
      ...modifyInventoryItemResponse,
    };

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "seedsUnlocked",
            profileId,
            uniqueKey: profileId,
          },
          {
            analyticName: `${getAnalyticName(seedConfig)}Unlocked`,
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

    await visitor
      .fireToast({
        groupId: "handlePurchaseSeed",
        title: "You purchased a new seed!",
        text: `You can now plant ${seedConfig.name} seeds in your garden.`,
      })
      .catch((error: AxiosError) => {
        return errorHandler({
          error,
          functionName: "handlePurchaseSeed",
          message: "Error firing toast",
        });
      });

    return res.json({
      success: true,
      visitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handlePurchaseSeed",
      message: "Error purchasing seed",
      req,
      res,
    });
  }
};
