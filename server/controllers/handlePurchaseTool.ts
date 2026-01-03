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
 * Handle tool purchase - allows visitor to purchase tools with coins
 */
export const handlePurchaseTool = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { toolId } = req.body;

    if (!toolId) throw "Valid toolId is required";

    // Get tool configuration
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { tools } = getInventoryItemsResponse;

    const toolConfig = tools[toolId];
    if (!toolConfig) throw "Invalid tool type";

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorInventory } = initializeVisitorDataResponse;

    // Check if visitor has enough coins
    if (visitorInventory.coins < toolConfig.cost) throw `Not enough coins.`;

    // Purchase the tool (modify quantity in inventory)
    const modifyCoinsResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: "Coins",
      quantity: -toolConfig.cost,
    });
    if (modifyCoinsResponse instanceof Error) throw modifyCoinsResponse;
    visitorInventory.coins = modifyCoinsResponse.quantity;

    const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: toolConfig.name,
      quantity: 1,
    });
    if (modifyInventoryItemResponse instanceof Error) throw modifyInventoryItemResponse;

    const availableQuantity = visitorInventory.tools[toolConfig.name]?.availableQuantity || 0;
    visitorInventory.tools[toolConfig.name] = modifyInventoryItemResponse;
    visitorInventory.tools[toolConfig.name].availableQuantity = availableQuantity + 1;

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "toolsUnlocked",
            profileId,
            uniqueKey: profileId,
          },
          {
            analyticName: `${getAnalyticName(toolConfig)}Unlocked`,
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

    await visitor
      .fireToast({
        groupId: "handlePurchaseTool",
        title: "You purchased a new tool!",
        text: `You can now use a ${toolConfig.name} in your garden.`,
      })
      .catch((error: AxiosError) => {
        return errorHandler({
          error,
          functionName: "handlePurchaseTool",
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
      functionName: "handlePurchaseTool",
      message: "Error purchasing tool",
      req,
      res,
    });
  }
};
