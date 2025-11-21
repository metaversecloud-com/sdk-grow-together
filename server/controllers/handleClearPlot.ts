import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  DroppedAsset,
  World,
  Visitor,
  DEFAULT_VISITOR_WORLD_DATA,
  User,
  getBaseUrl,
} from "../utils/index.js";
import { PlotAssetDataObjectType, VisitorDataObjectType } from "../types/index.js";
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

    const plotOwner = await User.create({ credentials, profileId: plotAssetData.ownerId });
    const ownerData = (await plotOwner.fetchDataObject()) as VisitorDataObjectType;

    // Delete all dropped assets in this plot
    const droppedAssetIds: string[] = [];
    const world = await World.create(urlSlug, { credentials });

    const [cropAssets, decorationAssets] = await Promise.all([
      world.fetchDroppedAssetsWithUniqueName({
        uniqueName: `GrowTogether_crop_${plotAssetData.ownerId}`,
        isPartial: true,
      }),
      world.fetchDroppedAssetsWithUniqueName({
        uniqueName: `GrowTogether_decoration_${plotAssetData.ownerId}`,
        isPartial: true,
      }),
    ]);

    if (Object.keys(cropAssets).length > 0) {
      for (const index in cropAssets) {
        droppedAssetIds.push(cropAssets[index].id!);
      }
    }
    if (Object.keys(decorationAssets).length > 0) {
      for (const index in decorationAssets) {
        droppedAssetIds.push(decorationAssets[index].id!);
      }
    }

    const ownerWorldData = ownerData.worlds?.[urlSlug];

    if (ownerWorldData.plotSignAssetId) {
      await DroppedAsset.get(ownerWorldData.plotSignAssetId, urlSlug, {
        credentials: { ...credentials, assetId: ownerWorldData.plotSignAssetId },
      })
        .then(async (textAsset) => {
          droppedAssetIds.push(textAsset.id!);
        })
        .catch(() => {
          console.error("Visitor text asset no longer in world");
        });
    }

    if (droppedAssetIds.length > 0) {
      promises.push(World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET!, credentials));
    }

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

    // Update world data to add this plot to claimed plots and remove original assetId
    promises.push(
      world.updateDataObject({
        [`plots.${assetId}`]: null,
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
