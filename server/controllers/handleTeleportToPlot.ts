import { Request, Response } from "express";
import {
  DroppedAsset,
  errorHandler,
  getBaseUrl,
  getCredentials,
  getQueryString,
  initializeVisitorData,
} from "../utils/index.js";

export const handleTeleportToPlot = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug } = credentials;

    const { visitor, visitorData } = await initializeVisitorData(credentials);

    const plotData = visitorData.worlds[urlSlug];

    const plotAssetId = plotData.plotAssetId;
    if (!plotAssetId) throw new Error("Plot asset id is undefined.");

    const userAsset = await DroppedAsset.get(plotAssetId, urlSlug, { credentials });

    const { x, y } = userAsset.position || { x: 0, y: 0 };
    await visitor.moveVisitor({
      shouldTeleportVisitor: true,
      x,
      y: y + 140,
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
          functionName: "handleTeleportToPlot",
          message: "Error opening iframe",
        });
        // if open fails, close the original iframe as it'll no longer work once the original asset is deleted
        await visitor.closeIframe(assetId).catch((error: any) => {
          return errorHandler({
            error,
            functionName: "handleTeleportToPlot",
            message: "Error closing iframe",
          });
        });
      });

    visitor.updateDataObject(
      {},
      {
        analytics: [
          {
            analyticName: "teleport-selfPlot",
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
      functionName: "handleTeleportToPlot",
      message: "Error teleporting to plot dropped asset",
      req,
      res,
    });
  }
};
