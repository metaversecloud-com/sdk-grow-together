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
 * Handle decoration purchase - allows visitor to purchase decorations with coins
 */
export const handlePurchaseDecoration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { decorationName } = req.body;

    if (!decorationName) throw "Valid decorationName is required";

    // Get decoration configuration
    const { ecosystemDecorations } = await getInventoryItems(credentials);

    const decorationConfig = ecosystemDecorations[decorationName];
    if (!decorationConfig) throw "Invalid decoration type";

    const { visitor, visitorInventory } = await initializeVisitorData(credentials);

    // Check if visitor has enough coins
    if (visitorInventory.coins < decorationConfig.cost) throw `Not enough coins.`;

    // Purchase the decoration (modify quantity in inventory)
    const modifyCoinsResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: "Coins",
      quantity: -decorationConfig.cost,
    });
    visitorInventory.coins = modifyCoinsResponse.quantity;

    const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: decorationConfig.name,
      quantity: 1,
    });

    const availableQuantity = visitorInventory.decorations[decorationConfig.name]?.availableQuantity || 0;
    visitorInventory.decorations[decorationConfig.name] = {
      ...visitorInventory.decorations[decorationConfig.name],
      ...modifyInventoryItemResponse,
    };
    visitorInventory.decorations[decorationConfig.name].availableQuantity = availableQuantity + 1;

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
            analyticName: `${getAnalyticName(decorationConfig)}Unlocked`,
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
