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
    const forceRefreshInventory = req.query.forceRefreshInventory === "true";

    const getPlotAssetsResult = await getPlotAssets(credentials, false);

    const plotAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
    const plotAssetData = (await plotAsset.fetchDataObject()) as PlotAssetDataObjectType;

    // Initialize visitor data with defaults if needed
    const { visitor, visitorData, visitorInventory } = await initializeVisitorData(credentials);

    let plotData = visitorData.worlds[urlSlug],
      xp = visitorInventory.xp || 0;
    const visitorPlotAssetId = plotData.plotAssetId;

    const promises = [];

    if (plotData?.plotAssetId === assetId) {
      const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
      promises.push(droppedAsset.updateDataObject({ lastInteractionDate: new Date().toISOString() }));
    } else if (plotAssetData.ownerId) {
      const plotOwner = await User.create({ credentials, profileId: plotAssetData.ownerId });

      const plotOwnerData = (await plotOwner.fetchDataObject()) as VisitorDataObjectType;
      plotData = plotOwnerData?.worlds?.[urlSlug];
      if (!plotData) throw new Error("Plot data not found for the owner");
      await plotOwner.fetchInventoryItems();
      xp = plotOwner.inventoryItems.find((item) => item.name === "Experience Points")?.quantity || 0;
    }

    promises.push(
      visitor.updateDataObject(
        {},
        {
          analytics: [
            {
              analyticName: `plotDrawerViews-${plotData.plotAssetId === assetId ? "self" : "non-self"}`,
              profileId,
              urlSlug,
              uniqueKey: profileId,
            },
          ],
        },
      ),
    );

    // Get all inventory items
    const { ecosystemDecorations, ecosystemSeeds, ecosystemTools } = await getInventoryItems(
      credentials,
      forceRefreshInventory,
    );

    // Fetch visitor details to get isAdmin status
    promises.push(visitor.fetchVisitor());

    await Promise.allSettled(promises);

    return res.json({
      success: true,
      isAdmin: visitor.isAdmin,
      plotAssetData,
      visitorData,
      visitorPlotAssetId,
      plotData,
      visitorInventory,
      ecosystemDecorations,
      ecosystemSeeds,
      ecosystemTools,
      noOfAvailablePlots: getPlotAssetsResult.availablePlotAssetIds.length,
      xp,
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
