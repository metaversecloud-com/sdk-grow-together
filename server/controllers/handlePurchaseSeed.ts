import { Request, Response } from "express";
import { errorHandler, getCredentials, initializeVisitorData } from "../utils/index.js";
import { seeds } from "../../shared/index.js";
import { AxiosError } from "axios";

/**
 * Handle seed purchase - allows visitor to purchase seeds with coins
 */
export const handlePurchaseSeed = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;
    const { seedId } = req.body;

    if (!seedId || typeof seedId !== "number") throw "Valid seedId is required";

    // Get seed configuration
    const seedConfig = seeds[seedId];
    if (!seedConfig) throw "Invalid seed type";

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    // Check if seed is already purchased (for paid seeds)
    if (seedConfig.cost > 0 && visitorData.seedsPurchased[seedId]) throw "Seed already purchased";

    // Check if visitor has enough coins
    if (visitorData.coinsAvailable < seedConfig.cost) {
      throw `Not enough coins. Need ${seedConfig.cost}, have ${visitorData.coinsAvailable}`;
    }

    // Free seeds don't need to be "purchased", they're always available
    if (seedConfig.cost === 0) {
      return res.json({
        success: true,
        data: { coinsRemaining: visitorData.coinsAvailable },
      });
    }

    // Purchase the seed
    visitorData.coinsAvailable = visitorData.coinsAvailable - seedConfig.cost;
    visitorData.seedsPurchased[seedId] = {
      id: seedId,
      datePurchased: new Date().toISOString(),
    };

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "seedPurchased",
          profileId,
          uniqueKey: profileId,
        },
      ],
    });

    await visitor
      .fireToast({
        groupId: "handlePurchaseSeed",
        title: "You purchased a new seed!",
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
      visitorData,
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
