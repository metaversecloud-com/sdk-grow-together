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
    const { ecosystemTools } = await getInventoryItems(credentials);

    const toolConfig = ecosystemTools[toolId];
    if (!toolConfig) throw "Invalid tool type";

    const { visitor, visitorInventory } = await initializeVisitorData(credentials);

    // Check if visitor has enough coins
    if (visitorInventory.coins < toolConfig.cost) throw `Not enough coins.`;

    // Purchase the tool (modify quantity in inventory)
    const modifyCoinsResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: "Coins",
      quantity: -toolConfig.cost,
    });
    visitorInventory.coins = modifyCoinsResponse.quantity;

    const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      id: toolId,
      quantity: toolConfig.quantity,
    });

    visitorInventory.tools[toolId] = {
      ...visitorInventory.tools[toolId],
      ...modifyInventoryItemResponse,
    };

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "toolsPurchased",
            profileId,
            uniqueKey: profileId,
            urlSlug,
          },
          {
            analyticName: `${getAnalyticName(toolConfig)}Purchased`,
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
