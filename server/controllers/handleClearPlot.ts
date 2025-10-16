import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  DroppedAsset,
  World,
  Visitor,
  DEFAULT_VISITOR_WORLD_DATA,
  User,
  Asset,
  getBaseUrl,
  modifyUserInventoryItem,
} from "../utils/index.js";
import { PlotAssetDataObjectType, VisitorDataObjectType, WorldDataObjectType } from "../types/index.js";
import { DroppedAssetClickType, VisitorInterface } from "@rtsdk/topia";
import { s3URL } from "../../shared/index.js";

/**
 * Handle plot clearing - allows admins to clear ownership of a plot
 * Visitor data will be reset for this world and plot will be unclaimed
 */
export const handleClearPlot = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId } = credentials;

    const promises = [];

    const admin = (await Visitor.get(visitorId, urlSlug, { credentials })) as VisitorInterface;
    if (!admin.isAdmin) throw "Only admins can clear plots";

    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    await plotAsset.fetchDataObject();

    let plotAssetData = plotAsset.dataObject as PlotAssetDataObjectType;
    if (!plotAssetData.ownerId) throw `This plot is not owned by anyone.`;

    const asset = Asset.create("webImageAsset", { credentials });
    const baseUrl = getBaseUrl(req.hostname);
    const droppedSignAsset = await DroppedAsset.drop(asset, {
      clickType: DroppedAssetClickType.LINK,
      clickableLink: `${baseUrl}/plot`,
      clickableLinkTitle: "Open Plot",
      isInteractive: true,
      interactivePublicKey: credentials.interactivePublicKey,
      isOpenLinkInDrawer: true,
      layer1: `${s3URL}/Open-Plot-Sign.png`,
      position: plotAsset.position,
      uniqueName: `GrowTogether_plot`,
      urlSlug,
    });

    const plotOwner = await User.create({ credentials, profileId: plotAssetData.ownerId });
    const ownerData = (await plotOwner.fetchDataObject()) as VisitorDataObjectType;
    const ownerWorldData = ownerData.worlds?.[urlSlug];

    if (Object.keys(ownerWorldData.decorations).length > 0) {
      for (const decoration of Object.values(ownerWorldData.decorations)) {
        promises.push(
          modifyUserInventoryItem({
            credentials,
            user: plotOwner,
            name: decoration.decorationName,
            quantity: 1,
          }),
        );
      }
    }

    // Delete all dropped assets in this plot
    const droppedAssetIds = Object.values(ownerWorldData?.plotSquares || {}).filter(
      (droppedAssetId): droppedAssetId is string => !!droppedAssetId,
    );

    if (droppedAssetIds.length > 0) {
      promises.push(World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET!, credentials));
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

    // Update world data to add this plot to claimed plots and remove original assetId
    const world = await World.create(urlSlug, { credentials });
    const worldDataObject = (await world.fetchDataObject()) as WorldDataObjectType;
    delete worldDataObject.claimedPlots[assetId];

    promises.push(
      world.updateDataObject({
        claimedPlots: {
          ...worldDataObject.claimedPlots,
          [droppedSignAsset.id!]: null,
        },
      }),
    );

    await Promise.allSettled(promises);

    await admin.closeIframe(assetId).catch((error: any) => {
      return errorHandler({
        error,
        functionName: "handleClearPlot",
        message: "Error closing iframe",
      });
    });

    await plotAsset.deleteDroppedAsset();

    return res.json({
      success: true,
      isAdmin: true,
      plotAssetData: {},
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleClearPlot",
      message: "Error clearing plot",
      req,
      res,
    });
  }
};
