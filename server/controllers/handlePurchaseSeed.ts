import { Request, Response } from "express";
import { errorHandler, getCredentials, initializeVisitorData, getSeedConfig } from "../utils/index.js";

/**
 * Handle seed purchase - allows visitor to purchase seeds with coins
 */
export const handlePurchaseSeed = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug, visitorId } = credentials;
    const { seedId } = req.body;

    if (!seedId || typeof seedId !== "number") {
      return res.status(400).json({
        success: false,
        error: "Valid seedId is required",
      });
    }

    // Get seed configuration
    const seedConfig = getSeedConfig(seedId);
    if (!seedConfig) {
      return res.status(400).json({
        success: false,
        error: "Invalid seed type",
      });
    }

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    // Check if seed is already purchased (for paid seeds)
    if (seedConfig.cost > 0 && visitorData.seedsPurchased[seedId]) {
      return res.status(400).json({
        success: false,
        error: "Seed already purchased",
      });
    }

    // Check if visitor has enough coins
    if (visitorData.coinsAvailable < seedConfig.cost) {
      return res.status(400).json({
        success: false,
        error: `Not enough coins. Need ${seedConfig.cost}, have ${visitorData.coinsAvailable}`,
      });
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
