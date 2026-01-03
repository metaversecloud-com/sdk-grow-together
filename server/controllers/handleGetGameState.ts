import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  getPlotAssets,
  getInventoryItems,
  User,
} from "../utils/index.js";
import { PlotAssetDataObjectType, VisitorDataObjectType } from "../types/index.js";

/**
 * Get the current game state for a visitor including their plot, crops, and coin balance
 */
export const handleGetGameState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;

    const getPlotAssetsResult = await getPlotAssets(credentials, false);
    if (getPlotAssetsResult instanceof Error) throw getPlotAssetsResult;

    const plotAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
    const plotAssetData = (await plotAsset.fetchDataObject()) as PlotAssetDataObjectType;

    // Initialize visitor data with defaults if needed
    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    let visitorPlotData = visitorData.worlds[urlSlug];

    const promises = [];

    if (visitorPlotData.plotAssetId === assetId) {
      const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
      promises.push(droppedAsset.updateDataObject({ lastInteractionDate: new Date().toISOString() }));
    } else if (plotAssetData.ownerId) {
      const plotOwner = await User.create({ credentials, profileId: plotAssetData.ownerId });
      const plotOwnerData = (await plotOwner.fetchDataObject()) as VisitorDataObjectType;
      visitorPlotData = plotOwnerData.worlds[urlSlug];
    }

    promises.push(
      visitor.updateDataObject(
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
      ),
    );

    // Get all inventory items
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { decorations, seeds, tools } = getInventoryItemsResponse;

    // Fetch visitor details to get isAdmin status
    promises.push(visitor.fetchVisitor());

    await Promise.allSettled(promises);

    return res.json({
      success: true,
      isAdmin: visitor.isAdmin,
      plotAssetData,
      visitorData,
      visitorPlotData,
      visitorInventory,
      decorations,
      seeds,
      tools,
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
