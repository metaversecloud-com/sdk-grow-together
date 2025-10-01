import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, initializeVisitorData } from "../utils/index.js";

export const handleTeleportToPlot = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug } = credentials;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];

    const plotAssetId = visitorPlotData.plotAssetId;
    if (!plotAssetId) throw new Error("Plot asset id is undefined.");

    const userAsset = await DroppedAsset.get(plotAssetId, urlSlug, { credentials });

    const { x, y } = userAsset.position || { x: 0, y: 0 };
    await visitor.moveVisitor({
      shouldTeleportVisitor: false,
      x,
      y,
    });

    await visitor.closeIframe(assetId).catch((error: any) =>
      errorHandler({
        error,
        functionName: "handleTeleportToPlot",
        message: "Error closing iframe",
      }),
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
