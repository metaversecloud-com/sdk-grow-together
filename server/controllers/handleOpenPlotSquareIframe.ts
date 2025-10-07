import { Request, Response } from "express";
import { errorHandler, getBaseUrl, getCredentials, initializeVisitorData, Visitor } from "../utils/index.js";

export const handleOpenPlotSquareIframe = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { displayName, interactivePublicKey, interactiveNonce, profileId, urlSlug, visitorId } = credentials;
    const { squareId, type } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];
    const assetId = visitorPlotData.plotSquares[squareId];

    if (!assetId) throw new Error("Nothing found on the specified square");

    // This will only work with ngrok, http://localhost is not permitted by Public API endpoint as valid link
    const baseUrl = getBaseUrl(req.hostname);
    const query = `?assetId=${assetId}&displayName=${displayName}&profileId=${profileId}&urlSlug=${urlSlug}&interactiveKey=${interactivePublicKey}&interactiveNonce=${interactiveNonce}&visitorId=${visitorId}`;
    await visitor
      .openIframe({
        droppedAssetId: assetId,
        link: `${baseUrl}/${type}?${query}`,
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
