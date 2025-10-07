import { Request, Response } from "express";
import { errorHandler, getCredentials, initializeVisitorData } from "../utils/index.js";
import { decorations } from "../../shared/index.js";
import { AxiosError } from "axios";

/**
 * Handle decoration purchase - allows visitor to purchase decorations with coins
 */
export const handlePurchaseDecoration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;
    const { decorationId } = req.body;

    if (!decorationId || typeof decorationId !== "number") throw "Valid decorationId is required";

    // Get decoration configuration
    const decorationConfig = decorations[decorationId];
    if (!decorationConfig) throw "Invalid decoration type";

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    // Check if visitor has enough coins
    if (visitorData.coinsAvailable < decorationConfig.cost) {
      throw `Not enough coins. Need ${decorationConfig.cost}, have ${visitorData.coinsAvailable}`;
    }

    // Purchase the decoration
    visitorData.coinsAvailable = visitorData.coinsAvailable - decorationConfig.cost;

    if (!visitorData.decorationsOwned[decorationId]) {
      visitorData.decorationsOwned[decorationId] = {
        id: decorationId,
        quantity: 1,
      };
    } else {
      visitorData.decorationsOwned[decorationId].quantity += 1;
    }

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "decorationPurchased",
          profileId,
          uniqueKey: profileId,
        },
      ],
    });

    await visitor
      .fireToast({
        groupId: "handlePurchaseDecoration",
        title: "You purchased a new decoration!",
      })
      .catch((error: AxiosError) => {
        return errorHandler({
          error,
          functionName: "handlePurchaseDecoration",
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
      functionName: "handlePurchaseDecoration",
      message: "Error purchasing decoration",
      req,
      res,
    });
  }
};
