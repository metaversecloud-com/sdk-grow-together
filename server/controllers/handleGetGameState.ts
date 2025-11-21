import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  getPlotAssets,
  getInventoryItems,
} from "../utils/index.js";
import { PlotAssetDataObjectType } from "../types/index.js";

/**
 * Get the current game state for a visitor including their plot, crops, and coin balance
 */
export const handleGetGameState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;

    const getPlotAssetsResult = await getPlotAssets(credentials);
    if (getPlotAssetsResult instanceof Error) throw getPlotAssetsResult;

    const plotAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
    const plotAssetData = (await plotAsset.fetchDataObject()) as PlotAssetDataObjectType;

    // Initialize visitor data with defaults if needed
    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];

    if (visitorPlotData.plotAssetId === assetId) {
      const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
      droppedAsset.updateDataObject({ lastInteractionDate: new Date().toISOString() });
    }

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: `plotDrawerViews-${visitorPlotData.plotAssetId === assetId ? "self" : "non-self"}`,
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

    // Get all inventory items
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { decorations, seeds } = getInventoryItemsResponse;

    await visitor.fetchVisitor(); // fetch visitor details to get isAdmin status

    return res.json({
      success: true,
      isAdmin: visitor.isAdmin,
      plotAssetData,
      visitorData,
      visitorPlotData: visitorData.worlds[urlSlug],
      visitorInventory,
      decorations,
      seeds,
      noOfAvailablePlots: getPlotAssetsResult.availablePlotAssetIds.length,
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
