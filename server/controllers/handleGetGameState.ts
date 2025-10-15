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
import { InventoryItemInterface } from "@rtsdk/topia";

interface Items extends InventoryItemInterface {
  metadata: { type?: string; cost?: number; rarity?: string };
}

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

    await visitor.fetchVisitor();

    await visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: `plotDrawerViews-${plotAssetData.ownerId === profileId ? "self" : "non-self"}`,
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

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

    return res.json({
      success: true,
      isAdmin: visitor.isAdmin,
      plotAssetData,
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
