import { Request, Response } from "express";
import { AxiosError } from "axios";
import {
  errorHandler,
  getCredentials,
  getInventoryItems,
  initializeVisitorData,
  modifyInventoryItem,
} from "../utils/index.js";

/**
 * Handle decoration purchase - allows visitor to purchase decorations with coins
 */
export const handlePurchaseDecoration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { decorationId } = req.body;

    if (!decorationId) throw "Valid decorationId is required";

    // Get decoration configuration
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { decorations } = getInventoryItemsResponse;

    const decorationConfig = decorations[decorationId];
    if (!decorationConfig) throw "Invalid decoration type";

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorInventory } = initializeVisitorDataResponse;

    // Check if visitor has enough coins
    if (visitorInventory["Coins"].quantity < decorationConfig.cost) {
      throw `Not enough coins. Need ${decorationConfig.cost}, have ${visitorInventory["Coins"].quantity}`;
    }

    // Purchase the decoration (modify quantity in inventory)
    const modifyCoinsResponse = await modifyInventoryItem({
      credentials,
      visitor,
      name: "Coins",
      quantity: -decorationConfig.cost,
    });
    if (modifyCoinsResponse instanceof Error) throw modifyCoinsResponse;
    visitorInventory["Coins"].quantity = modifyCoinsResponse;

    const modifyInventoryItemResponse = await modifyInventoryItem({
      credentials,
      visitor,
      name: decorationConfig.name,
      quantity: 1,
    });
    if (modifyInventoryItemResponse instanceof Error) throw modifyInventoryItemResponse;

    visitorInventory[decorationConfig.name] = {
      id: decorationConfig.name,
      quantity: modifyInventoryItemResponse,
    };

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "decorationsUnlocked",
            profileId,
            uniqueKey: profileId,
          },
          {
            analyticName: `${decorationConfig.name.toLowerCase()}Unlocked`,
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

    await visitor
      .fireToast({
        groupId: "handlePurchaseDecoration",
        title: "You purchased a new decoration!",
        text: `You can now place a ${decorationConfig.name} in your garden.`,
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
      visitorInventory,
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
