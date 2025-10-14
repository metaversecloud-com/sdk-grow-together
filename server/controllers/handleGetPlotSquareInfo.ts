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
    const { assetId, urlSlug } = credentials;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitorData, visitorInventory } = initializeVisitorDataResponse;

    const droppedAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
    const squareData = (await droppedAsset.fetchDataObject()) as CropDataObjectType;

    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { decorations, seeds } = getInventoryItemsResponse;

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
