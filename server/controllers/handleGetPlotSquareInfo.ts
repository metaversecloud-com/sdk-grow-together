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

    const { visitor, visitorData, visitorInventory } = await initializeVisitorData(credentials);

    const droppedAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
    const squareData = (await droppedAsset.fetchDataObject()) as CropDataObjectType;

    const { seedId, name, squareId, ownerId } = squareData;

    if (name && profileId === ownerId && !visitorData.worlds[urlSlug]?.plotSquares[squareId]) {
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

    const { ecosystemDecorations, ecosystemSeeds, ecosystemTools } = await getInventoryItems(credentials);

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
      plotData: visitorData.worlds[urlSlug],
      visitorInventory,
      ecosystemDecorations,
      ecosystemSeeds,
      ecosystemTools,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetPlotSquareInfo",
      message: "Error getting plot square info",
      req,
      res,
    });
  }
};
