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

    const updatedVisitorData = visitorData;
    const visitorPlotData = visitorData.worlds[urlSlug];

    if (visitorPlotData.plotAssetId) {
      if (visitorPlotData.plotAssetId === assetId) {
        updatedVisitorData.worlds[urlSlug].lastInteractionDate = new Date().toISOString();

        const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
        droppedAsset.updateDataObject({ lastInteractionDate: new Date().toISOString() }).catch((error) => {
          errorHandler({
            error,
            functionName: "handleGetGameState",
            message: "Failed to update plot asset's last interaction date",
          });
        });
      } else {
        await DroppedAsset.get(visitorPlotData.plotAssetId, urlSlug, {
          credentials: { ...credentials, assetId: visitorPlotData.plotAssetId },
        }).catch(() => {
          console.error("Visitor plot asset no longer in world");
          // their plot is gone - clear from visitor data object for this world only so they can claim a new one
          delete updatedVisitorData.worlds[urlSlug];
        });
      }
    }

    await visitor.updateDataObject(updatedVisitorData, {
      analytics: [
        {
          analyticName: `plotDrawerViews-${visitorPlotData.plotAssetId === assetId ? "self" : "non-self"}`,
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
      ],
    });

    // Get inventory items
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { decorations, seeds } = getInventoryItemsResponse;

    /* Commenting out for now but may be used for wilting and losing crops in future
    // Update crop growth levels for all crops
    const updatedCrops = { ...visitorData.crops };
    let hasUpdates = false;

    for (const [cropAssetId, crop] of Object.entries(visitorData.crops)) {
      const seedConfig = seeds[crop.seedId];
      if (seedConfig) {
        const currentGrowthLevel = calculateGrowthLevel(
          crop.dateDropped,
          seedConfig.growthTime,
          seedConfig.harvestLevel,
        );

        if (currentGrowthLevel !== crop.growLevel) {
          // Update growth level in memory
          updatedCrops[cropAssetId] = {
            ...crop,
            growLevel: currentGrowthLevel,
          };
          hasUpdates = true;

          try {
            const droppedAsset = await DroppedAsset.create(cropAssetId, urlSlug, { credentials });
            if (droppedAsset) {
              const layer1 = getImageVariation(crop.seedId, currentGrowthLevel)
              await droppedAsset.updateWebImageLayers("", layer1);
            }
          } catch (error) {
            console.error("Failed to update dropped asset:", error);
          }
        }
      }
    }

    // Save updated crop data if there were changes
    if (hasUpdates) {
      const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
      visitorData = { ...visitorData, crops: updatedCrops };
      await visitor.updateDataObject(
        { [urlSlug]: visitorData },
        {
          analytics: [{ analyticName: "cropGrowthUpdated" }],
        },
      );
    }
      */

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
