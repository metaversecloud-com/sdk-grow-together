import { Request, Response } from "express";
import {
  errorHandler,
  getBaseUrl,
  getCredentials,
  getQueryString,
  initializeVisitorData,
  Visitor,
} from "../utils/index.js";

export const handleOpenPlotSquareIframe = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId } = credentials;
    const { itemAssetId, type } = req.body;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials: { ...credentials, assetId: itemAssetId } });

    if (!itemAssetId) throw new Error("Nothing found on the specified square");

    const baseUrl = getBaseUrl(req.hostname);
    const query = `?assetId=${itemAssetId}&${getQueryString(credentials)}`;
    await visitor
      .openIframe({
        droppedAssetId: itemAssetId,
        link: `${baseUrl}/${type}?${encodeURIComponent(query)}`,
        shouldOpenInDrawer: true,
        title: "Garden Plot Square",
      })
      .catch((error: any) => {
        return errorHandler({
          error,
          functionName: "handleOpenPlotSquareIframe",
          message: "Error opening iframe",
        });
      });

    return res.json({
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleOpenPlotSquareIframe",
      message: "Error viewing plot square (opening in iframe from plot iframe)",
      req,
      res,
    });
  }
};
