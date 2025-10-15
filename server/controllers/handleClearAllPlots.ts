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

    // Extract all plot asset ids (filter out nulls)
    const plotAssetIds = Object.keys(getPlotAssetsResult.claimedPlots).filter((plotId): plotId is string => !!plotId);

    const asset = Asset.create("webImageAsset", { credentials });
    const baseUrl = getBaseUrl(req.hostname);

    // Collect all data from plot assets
    const ownerIds: string[] = [];
    const newPlotAssetIds: string[] = [];
    const plotDataPromises = plotAssetIds.map(async (plotId) => {
      const plotAsset = await DroppedAsset.create(plotId, urlSlug, {
        credentials: { ...credentials, assetId: plotId },
      });
      await plotAsset.fetchDataObject();

      const plotAssetData = plotAsset.dataObject as PlotAssetDataObjectType;
      if (plotAssetData.ownerId) {
        ownerIds.push(plotAssetData.ownerId);

        const newPlotAsset = await DroppedAsset.drop(asset, {
          clickType: DroppedAssetClickType.LINK,
          clickableLink: `${baseUrl}/plot`,
          clickableLinkTitle: "Open Plot",
          isInteractive: true,
          interactivePublicKey: credentials.interactivePublicKey,
          isOpenLinkInDrawer: true,
          layer1: `${s3URL}/Open-Plot-Sign.png`,
          position: plotAsset.position,
          uniqueName: `BountyBuilders_plot`,
          urlSlug,
        });
        newPlotAssetIds.push(newPlotAsset.id!);
      }

      return { plotId, plotAssetData };
    });

    // Wait for all plot data to be collected
    await Promise.all(plotDataPromises);

    // Collect all dropped assets from all owners
    const allDroppedAssetIds: string[] = [];
    const uniqueOwnerIds = [...new Set(ownerIds)]; // Remove duplicates

    const ownerDataPromises = uniqueOwnerIds.map(async (ownerId) => {
      const plotOwner = await User.create({ credentials, profileId: ownerId });
      const ownerData = (await plotOwner.fetchDataObject()) as VisitorDataObjectType;
      const ownerWorldData = ownerData.worlds?.[urlSlug];

      // Collect dropped assets from this owner's plot squares
      const ownerDroppedAssetIds = Object.values(ownerWorldData?.plotSquares || {}).filter(
        (droppedAssetId): droppedAssetId is string => !!droppedAssetId,
      );

      allDroppedAssetIds.push(...ownerDroppedAssetIds);

      // TODO: Add logic to return decorations to owners' inventory

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

    // Wait for all owner data to be collected
    await Promise.all(ownerDataPromises);

    // Delete all collected dropped assets from all plot squares
    if (allDroppedAssetIds.length > 0) {
      promises.push(
        World.deleteDroppedAssets(urlSlug, allDroppedAssetIds, process.env.INTERACTIVE_SECRET!, credentials),
      );
    }

    // Update world data to remove ownership from all claimed plots
    const world = await World.create(urlSlug, { credentials });

    // Create an update object with all plot assets set to null
    const updateObj: Record<string, null> = {};
    newPlotAssetIds.forEach((plotId) => {
      updateObj[`claimedPlots.${plotId}`] = null;
    });

    promises.push(world.updateDataObject(updateObj));

    await Promise.allSettled(promises);

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
