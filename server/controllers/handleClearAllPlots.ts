import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  DroppedAsset,
  World,
  Visitor,
  DEFAULT_VISITOR_WORLD_DATA,
  User,
  getPlotAssets,
  Asset,
  getBaseUrl,
  modifyUserInventoryItem,
  dropKeyAsset,
} from "../utils/index.js";
import { PlotAssetDataObjectType, VisitorDataObjectType } from "../types/index.js";
import { DroppedAssetClickType, VisitorInterface } from "@rtsdk/topia";
import { s3URL } from "../../shared/index.js";

/**
 * Handle clearing all plots - allows admins to clear ownership of all plots, removing all dropped assets in those plots
 * All Visitors' data will be reset for this world and all plots will be unclaimed
 */
export const handleClearAllPlots = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId } = credentials;

    const promises = [];

    const admin = (await Visitor.get(visitorId, urlSlug, { credentials })) as VisitorInterface;
    if (!admin.isAdmin) throw "Only admins can clear plots";

    // Get all plot assets
    const getPlotAssetsResult = await getPlotAssets(credentials, true);
    if (getPlotAssetsResult instanceof Error) throw getPlotAssetsResult;

    // Extract all plot asset ids (filter only keys with non-null values)
    const plotAssetIds = Object.entries(getPlotAssetsResult.claimedPlots)
      .filter(([_, value]) => value !== null)
      .map(([key, _]) => key);

    const asset = Asset.create("webImageAsset", { credentials });
    const baseUrl = getBaseUrl(req.hostname);

    // Collect all data from plot assets in batches for better performance
    const ownerIds: string[] = [];
    const newPlotAssetIds: string[] = [];

    // Process plots in batches of 10 for better performance
    const batchSize = 10;
    const plotAssetBatches = [];

    for (let i = 0; i < plotAssetIds.length; i += batchSize) {
      plotAssetBatches.push(plotAssetIds.slice(i, i + batchSize));
    }

    for (const batch of plotAssetBatches) {
      const batchPromises = batch.map(async (plotId) => {
        const plotAsset = await DroppedAsset.get(plotId, urlSlug, {
          credentials: { ...credentials, assetId: plotId },
        });
        await plotAsset.fetchDataObject();

        const plotAssetData = plotAsset.dataObject as PlotAssetDataObjectType;
        if (plotAssetData.ownerId) {
          ownerIds.push(plotAssetData.ownerId);

          const dropKeyAssetResponse = await dropKeyAsset({
            credentials,
            hostname: req.hostname,
            position: plotAsset.position,
          });
          if (dropKeyAssetResponse instanceof Error) {
            console.log("Error dropping key asset while clearing all plots:", dropKeyAssetResponse);
          } else {
            newPlotAssetIds.push(dropKeyAssetResponse.droppedSignAsset.id!);
          }
        }

        return { plotId, plotAssetData };
      });

      // Process each batch sequentially to avoid overwhelming the server
      await Promise.all(batchPromises);
    }

    // Collect all dropped assets from all owners
    const allDroppedAssetIds: string[] = [];
    const uniqueOwnerIds = [...new Set(ownerIds)]; // Remove duplicates

    // Process owners in batches for better performance
    const ownerBatchSize = 5;
    const ownerBatches = [];

    for (let i = 0; i < uniqueOwnerIds.length; i += ownerBatchSize) {
      ownerBatches.push(uniqueOwnerIds.slice(i, i + ownerBatchSize));
    }

    for (const batch of ownerBatches) {
      const batchPromises = batch.map(async (ownerId) => {
        const plotOwner = await User.create({ credentials, profileId: ownerId });
        const ownerData = (await plotOwner.fetchDataObject()) as VisitorDataObjectType;
        const ownerWorldData = ownerData.worlds?.[urlSlug];

        if (!ownerWorldData) {
          return { ownerId, ownerData };
        }

        // Collect dropped assets from this owner's plot squares - more efficiently
        const ownerDroppedAssetIds = Object.values(ownerWorldData.plotSquares || {}).filter(Boolean) as string[];
        allDroppedAssetIds.push(...ownerDroppedAssetIds);

        // Handle decorations and inventory updates
        if (ownerWorldData.decorations && Object.keys(ownerWorldData.decorations).length > 0) {
          // Create a batch promise for inventory modifications
          const inventoryUpdates = Object.values(ownerWorldData.decorations).map((decoration) =>
            modifyUserInventoryItem({
              credentials,
              user: plotOwner,
              name: decoration.decorationName,
              quantity: 1,
            }),
          );

          // Add all inventory updates as a single batch promise
          promises.push(Promise.all(inventoryUpdates));
        }

        // Reset visitor data for this world to defaults
        promises.push(
          plotOwner.updateDataObject(
            { [`worlds.${urlSlug}`]: DEFAULT_VISITOR_WORLD_DATA },
            {
              analytics: [{ analyticName: "plotsCleared" }],
            },
          ),
        );

        return { ownerId, ownerData };
      });

      // Process each batch sequentially to avoid overwhelming the server
      await Promise.all(batchPromises);
    }

    // Delete all collected dropped assets from all plot squares in batches
    if (allDroppedAssetIds.length > 0) {
      // Split large arrays of asset IDs into smaller chunks to avoid API limits
      const deleteChunkSize = 50;
      for (let i = 0; i < allDroppedAssetIds.length; i += deleteChunkSize) {
        const chunk = allDroppedAssetIds.slice(i, i + deleteChunkSize);
        promises.push(World.deleteDroppedAssets(urlSlug, chunk, process.env.INTERACTIVE_SECRET!, credentials));
      }
    }

    // Update world data to remove ownership from all claimed plots
    const world = await World.create(urlSlug, { credentials });

    // Create an update object with all plot assets set to null
    // Process in batches to avoid large object updates
    const batchUpdateSize = 25;
    for (let i = 0; i < newPlotAssetIds.length; i += batchUpdateSize) {
      const updateObj: Record<string, null> = {};
      const chunk = newPlotAssetIds.slice(i, i + batchUpdateSize);

      chunk.forEach((plotId) => {
        updateObj[`claimedPlots.${plotId}`] = null;
      });

      promises.push(world.setDataObject(updateObj));
    }

    // Run all the promises in parallel but catch errors
    await Promise.allSettled(promises);

    // Close iframe and then delete old plot assets
    await admin.closeIframe(assetId).catch((error: any) => {
      return errorHandler({
        error,
        functionName: "handleClearPlot",
        message: "Error closing iframe",
      });
    });

    await World.deleteDroppedAssets(urlSlug, plotAssetIds, process.env.INTERACTIVE_SECRET!, credentials);

    return res.json({
      success: true,
      isAdmin: true,
      plotAssetData: {},
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleClearAllPlots",
      message: "Error clearing all plots",
      req,
      res,
    });
  }
};
