import { Request, Response } from "express";
import { errorHandler, getBaseUrl, getCredentials, Visitor } from "../utils/index.js";

export const handleOpenPlotIframe = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { displayName, interactivePublicKey, interactiveNonce, profileId, urlSlug, visitorId } = credentials;
    const { plotAssetId } = req.body;

    if (!plotAssetId) throw new Error("Plot asset id is undefined.");

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials: { ...credentials, assetId: plotAssetId } });

    // This will only work with ngrok, http://localhost is not permitted by Public API endpoint as valid link
    const baseUrl = getBaseUrl(req.hostname);
    const query = `?assetId=${plotAssetId}&displayName=${displayName}&profileId=${profileId}&urlSlug=${urlSlug}&interactiveKey=${interactivePublicKey}&interactiveNonce=${interactiveNonce}&visitorId=${visitorId}`;
    await visitor
      .openIframe({
        droppedAssetId: plotAssetId,
        link: `${baseUrl}/plot?${query}`,
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
      message: "Error viewing plot (opening in iframe from another plant iframe)",
      req,
      res,
    });
  }
};
