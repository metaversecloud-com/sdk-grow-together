import { Request, Response } from "express";
import { errorHandler, getBaseUrl, getCredentials, getQueryString, Visitor } from "../utils/index.js";

export const handleOpenPlotIframe = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId } = credentials;
    const { plotAssetId } = req.body;

    if (!plotAssetId) throw new Error("Plot asset id is undefined.");

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials: { ...credentials, assetId: plotAssetId } });

    const baseUrl = getBaseUrl(req.hostname);
    await visitor
      .openIframe({
        droppedAssetId: plotAssetId,
        link: `${baseUrl}/plot?assetId=${plotAssetId}&${getQueryString(credentials)}`,
        shouldOpenInDrawer: true,
        title: "Garden Plot",
      })
      .catch((error: any) => {
        return errorHandler({
          error,
          functionName: "handleOpenPlotIframe",
          message: "Error opening iframe",
        });
      });

    return res.json({
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleOpenPlotIframe",
      message: "Error viewing plot (opening in iframe from another crop iframe)",
      req,
      res,
    });
  }
};
