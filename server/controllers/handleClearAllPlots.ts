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
  getBaseUrl,
} from "../utils/index.js";
import { PlotAssetDataObjectType, VisitorDataObjectType } from "../types/index.js";
import { DroppedAssetClickType, DroppedAssetInterface, VisitorInterface } from "@rtsdk/topia";
import { s3URL } from "../../shared/index.js";

/**
 * Handle clearing all plots - allows admins to clear ownership of all plots, removing all dropped assets in those plots
 * All Visitors' data will be reset for this world and all plots will be unclaimed
 */
export const handleClearAllPlots = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId } = credentials;
    const { clearInactiveOnly } = req.body;

    const promises = [];

    const admin = (await Visitor.get(visitorId, urlSlug, { credentials })) as VisitorInterface;
    if (!admin.isAdmin) throw "Only admins can clear plots";

    // Get all plot assets
    const getPlotAssetsResult = await getPlotAssets(credentials);
    if (getPlotAssetsResult instanceof Error) throw getPlotAssetsResult;

    const { claimedPlotAssetIds } = getPlotAssetsResult;

    // Collect all data from plot assets in batches for better performance
    const ownerIds: string[] = [];
    const newPlotAssetIds: string[] = [];

    // Process plots in batches of 10 for better performance
    const batchSize = 10;
    const plotAssetBatches = [];

    for (let i = 0; i < claimedPlotAssetIds.length; i += batchSize) {
      plotAssetBatches.push(claimedPlotAssetIds.slice(i, i + batchSize));
    }

    for (const batch of plotAssetBatches) {
      const batchPromises = batch.map(async (plotId) => {
        const plotAsset = await DroppedAsset.get(plotId, urlSlug, {
          credentials: { ...credentials, assetId: plotId },
        });
        await plotAsset.fetchDataObject();

        const plotAssetData = plotAsset.dataObject as PlotAssetDataObjectType;

        // Only clear plots that are owned and if they have been inactive for more than 2 weeks when clearInactiveOnly is true
        if (
          plotAssetData.ownerId &&
          (!clearInactiveOnly ||
            (clearInactiveOnly &&
              plotAssetData.lastInteractionDate &&
              new Date(plotAssetData.lastInteractionDate) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)))
        ) {
          ownerIds.push(plotAssetData.ownerId);

          // Update dropped sign asset image and link
          const baseUrl = getBaseUrl(req.hostname);
          const clickableLink = `${baseUrl}/plot`;
          promises.push(
            plotAsset.updateClickType({
              clickType: DroppedAssetClickType.LINK,
              clickableLink,
              clickableLinkTitle: "Available Garden",
              isOpenLinkInDrawer: true,
            }),
          );
          promises.push(plotAsset.updateWebImageLayers("", `${s3URL}/OpenGardenSign.png`));
          promises.push(plotAsset.setDataObject({}));

          newPlotAssetIds.push(plotAsset.id!);
        }

        return { plotId, plotAssetData };
      });

      // Process each batch sequentially to avoid overwhelming the server
      await Promise.allSettled(batchPromises);
    }
    const uniqueOwnerIds = [...new Set(ownerIds)]; // Remove duplicates

    // Collect all dropped assets from all owners
    const allDroppedAssetIds: string[] = [];

    const world = await World.create(urlSlug, { credentials });

    const [cropAssets, decorationAssets, textAssets] = await Promise.all([
      world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "GrowTogether_crop",
        isPartial: true,
      }),
      world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "GrowTogether_decoration",
        isPartial: true,
      }),
      world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "GrowTogether_ownerText",
        isPartial: true,
      }),
    ]);

    const allDroppedAssets: DroppedAssetInterface[] = [];
    allDroppedAssets.push(...Object.values(cropAssets));
    allDroppedAssets.push(...Object.values(decorationAssets));
    allDroppedAssets.push(...Object.values(textAssets));

    // Only push if uniqueName contains an ownerId found in uniqueOwnerIds
    if (allDroppedAssets.length > 0) {
      for (const index in allDroppedAssets) {
        const asset = allDroppedAssets[index];
        if (
          !clearInactiveOnly ||
          uniqueOwnerIds.some((ownerId) => {
            return asset.uniqueName?.includes(ownerId);
          })
        ) {
          allDroppedAssetIds.push(asset.id!);
        }
      }
    }

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

        if (!ownerWorldData) return { ownerId, ownerData };

        if (ownerWorldData.plotSignAssetId) allDroppedAssetIds.push(ownerWorldData.plotSignAssetId);

        // Reset placedDecorations for this urlSlug only
        if (ownerData.placedDecorations) {
          for (const decorationId of Object.keys(ownerData.placedDecorations)) {
            if (ownerData.placedDecorations[decorationId][urlSlug]) {
              delete ownerData.placedDecorations[decorationId][urlSlug];
              // Clean up empty objects
              if (Object.keys(ownerData.placedDecorations[decorationId]).length === 0) {
                delete ownerData.placedDecorations[decorationId];
              }
            }
          }
        }

        // Reset visitor data for this world to defaults
        ownerData.worlds[urlSlug] = DEFAULT_VISITOR_WORLD_DATA;
        promises.push(
          plotOwner.updateDataObject(ownerData, {
            analytics: [{ analyticName: "plotsCleared" }],
          }),
        );

        return { ownerId, ownerData };
      });

      // Process each batch sequentially to avoid overwhelming the server
      await Promise.all(batchPromises);
    }

    // Delete all selected dropped assets from all plot squares in batches
    const uniqueDroppedAssetIds = [...new Set(allDroppedAssetIds)]; // Remove duplicates
    if (uniqueDroppedAssetIds.length > 0) {
      // Split large arrays of asset ids into smaller chunks to avoid API limits
      const deleteChunkSize = 50;
      for (let i = 0; i < uniqueDroppedAssetIds.length; i += deleteChunkSize) {
        const chunk = uniqueDroppedAssetIds.slice(i, i + deleteChunkSize);
        promises.push(World.deleteDroppedAssets(urlSlug, chunk, process.env.INTERACTIVE_SECRET!, credentials));
      }
    }

    // Create an update object with selected plot assets set to null
    // Process in batches to avoid large object updates
    const batchUpdateSize = 25;
    for (let i = 0; i < newPlotAssetIds.length; i += batchUpdateSize) {
      // Build the update object as { plots: { plotId: null, ... } }
      const plotsUpdate: Record<string, null> = {};
      const chunk = newPlotAssetIds.slice(i, i + batchUpdateSize);

      chunk.forEach((plotId) => {
        plotsUpdate[plotId] = null;
      });

      // Update world data to remove ownership from selected claimed plots
      promises.push(world.setDataObject({ plots: plotsUpdate }));
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
