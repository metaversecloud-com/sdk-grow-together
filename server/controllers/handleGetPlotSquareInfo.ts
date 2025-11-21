import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  DroppedAsset,
  initializeVisitorData,
  getInventoryItems,
} from "../utils/index.js";
import { CropDataObjectType } from "../types/SharedTypes.js";

/**
 * Get the info for a specific plot square
 */
export const handleGetPlotSquareInfo = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    const droppedAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
    const squareData = (await droppedAsset.fetchDataObject()) as CropDataObjectType;

    const { seedId, squareId, ownerId } = squareData;

    if (seedId && profileId === ownerId && !visitorData.worlds[urlSlug]?.plotSquares[squareId]) {
      await visitor.closeIframe(assetId).catch((error: any) => {
        return errorHandler({
          error,
          functionName: "handleGetPlotSquareInfo",
          message: "Error closing iframe",
        });
      });

      await droppedAsset.deleteDroppedAsset();

      return res.json({
        success: false,
        message: "No crop found on the specified square",
      });
    }

    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { decorations, seeds } = getInventoryItemsResponse;

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: `${seedId ? "cropDrawerViews" : "decorationDrawerViews"}-${ownerId === profileId ? "self" : "non-self"}`,
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

    return res.json({
      success: true,
      squareData,
      visitorData,
      visitorPlotData: visitorData.worlds[urlSlug],
      visitorInventory,
      decorations,
      seeds,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetGameState",
      message: "Error getting game state",
      req,
      res,
    });
  }
};
