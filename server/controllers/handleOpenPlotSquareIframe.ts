import { Request, Response } from "express";
import { errorHandler, getBaseUrl, getCredentials, getQueryString, initializeVisitorData } from "../utils/index.js";

export const handleOpenPlotSquareIframe = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug } = credentials;
    const { squareId, type } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const plotData = visitorData.worlds[urlSlug];
    const assetId = plotData.plotSquares[squareId];

    if (!assetId) throw new Error("Nothing found on the specified square");

    const baseUrl = getBaseUrl(req.hostname);
    const query = `?assetId=${assetId}&${getQueryString(credentials)}`;
    await visitor
      .openIframe({
        droppedAssetId: assetId,
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
