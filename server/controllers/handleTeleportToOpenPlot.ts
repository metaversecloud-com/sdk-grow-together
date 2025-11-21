import { Request, Response } from "express";
import {
  DroppedAsset,
  errorHandler,
  getBaseUrl,
  getCredentials,
  getPlotAssets,
  getQueryString,
  Visitor,
} from "../utils/index.js";

export const handleTeleportToOpenPlot = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug, visitorId } = credentials;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });

    // Get all plot assets
    const getPlotAssetsResult = await getPlotAssets(credentials);
    if (getPlotAssetsResult instanceof Error) throw getPlotAssetsResult;

    const { availablePlotAssetIds } = getPlotAssetsResult;
    if (availablePlotAssetIds.length === 0) throw new Error("No available plots to teleport to.");

    const plotAssetId = availablePlotAssetIds[Math.floor(Math.random() * availablePlotAssetIds.length)];
    const plotAsset = await DroppedAsset.get(plotAssetId, urlSlug, {
      credentials: { ...credentials, assetId: plotAssetId },
    });

    // Teleport visitor to the plot position
    const { x, y } = plotAsset.position || { x: 0, y: 0 };
    await visitor.moveVisitor({
      shouldTeleportVisitor: true,
      x,
      y: y + 100,
    });

    // Open the plot iframe for the visitor
    const baseUrl = getBaseUrl(req.hostname);
    const link = `${baseUrl}/plot?&assetId=${plotAssetId}&${getQueryString(credentials)}`;
    await visitor
      .openIframe({
        droppedAssetId: plotAssetId,
        link,
        shouldOpenInDrawer: true,
        title: "Open Garden",
      })
      .catch(async (error: any) => {
        errorHandler({
          error,
          functionName: "handleClaimPlot",
          message: "Error opening iframe",
        });
        // if open fails, close the original iframe as it'll no longer work once the original asset is deleted
        await visitor.closeIframe(assetId).catch((error: any) => {
          return errorHandler({
            error,
            functionName: "handleClaimPlot",
            message: "Error closing iframe",
          });
        });
      });

    visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "teleport-openPlot",
            profileId,
            urlSlug,
            uniqueKey: profileId,
          },
        ],
      },
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleTeleportToOpenPlot",
      message: "Error teleporting to open plot dropped asset",
      req,
      res,
    });
  }
};
