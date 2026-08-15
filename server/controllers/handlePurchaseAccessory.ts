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
 * Handle accessory purchase - allows visitor to purchase an accessory with coins (one-time only)
 */
export const handlePurchaseAccessory = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { accessoryId } = req.body;

    if (!accessoryId) throw "Valid accessoryId is required";

    // Get accessory configuration
    const { ecosystemAccessories } = await getInventoryItems(credentials);

    const accessoryConfig = ecosystemAccessories[accessoryId];
    if (!accessoryConfig) throw "Invalid accessory type";

    const { visitor, visitorInventory } = await initializeVisitorData(credentials);

    // Check if accessory is already owned (accessories can only be purchased once)
    if (visitorInventory.accessories[accessoryId]) throw "Accessory already purchased";

    // Check if visitor has enough coins
    if (visitorInventory.coins < accessoryConfig.cost) throw `Not enough coins.`;

    // Purchase the accessory (modify quantity in inventory)
    const modifyCoinsResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: "Coins",
      quantity: -accessoryConfig.cost,
    });
    visitorInventory.coins = modifyCoinsResponse.quantity;

    const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      id: accessoryId,
      quantity: 1,
    });

    visitorInventory.accessories[accessoryConfig.id] = {
      ...visitorInventory.accessories[accessoryConfig.id],
      ...modifyInventoryItemResponse,
    };

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "accessoriesUnlocked",
            profileId,
            uniqueKey: profileId,
            urlSlug,
          },
          {
            analyticName: `${getAnalyticName(accessoryConfig)}Unlocked`,
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

    await visitor
      .fireToast({
        groupId: "handlePurchaseAccessory",
        title: "You purchased a new accessory!",
        text: `You now own ${accessoryConfig.displayName}.`,
      })
      .catch((error: AxiosError) => {
        return errorHandler({
          error,
          functionName: "handlePurchaseAccessory",
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
      functionName: "handlePurchaseAccessory",
      message: "Error purchasing accessory",
      req,
      res,
    });
  }
};
