import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  Visitor,
  DroppedAsset,
  getBaseUrl,
} from "../utils/index.js";
import { PlotAssetDataObject } from "../types/index.js";

/**
 * Handle plot claiming - allows visitor to claim ownership of a plot
 * Each visitor can only claim one plot total
 */
export const handleClaimPlot = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId, profileId, displayName } = credentials;

    // Initialize visitor data and check if they already own a plot
    const visitorData = await initializeVisitorData(credentials);

    if (visitorData.ownedPlot) {
      return res.status(400).json({
        success: false,
        error: "You already own a plot. Each player can only claim one plot.",
      });
    }

    // Check if this plot is already claimed by someone else
    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    await plotAsset.fetchDataObject();

    let plotData = plotAsset.dataObject as PlotAssetDataObject;

    if (plotData?.ownerId && plotData.ownerId !== profileId) {
      return res.status(400).json({
        success: false,
        error: `This plot is already owned by ${plotData.ownerName || "another player"}.`,
      });
    }

    // Claim the plot
    const claimedDate = new Date().toISOString();

    // Initialize empty 4x4 grid (16 squares, all null initially)
    const plotSquares: { [key: number]: string | null } = {};
    for (let i = 0; i < 16; i++) {
      plotSquares[i] = null;
    }

    // Update visitor's data object
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    const updatedVisitorData = {
      ...visitorData,
      ownedPlot: {
        plotAssetId: assetId,
        claimedDate,
        plotSquares,
      },
    };

    await visitor.updateDataObject(
      { [urlSlug]: updatedVisitorData },
      {
        analytics: [{ analyticName: "plot_claimed" }],
      },
    );

    // Update plot asset's data object to mark ownership
    plotData = {
      ownerId: profileId,
      ownerName: displayName,
      claimedDate,
    };
    await plotAsset.setDataObject(plotData);

    // Update plot's clickable link
    // const baseUrl = getBaseUrl(req.hostname);
    // const updatedLink = `${baseUrl}/plot?ownerName=${encodeURIComponent(displayName)}&ownerProfileId=${profileId}`;
    // const text = `${displayName}'s Plot`;
    // await Promise.all([
    //   plotAsset.updateClickType({
    //     clickableLink: updatedLink,
    //     clickableLinkTitle: text,
    //     isOpenLinkInDrawer: true,
    //   }),
    //   plotAsset.updateCustomTextAsset({}, text),
    // ]);
    await plotAsset.updateCustomTextAsset({}, `${displayName}'s Plot`);

    return res.json({
      success: true,
      plotAssetId: assetId,
      claimedDate,
      visitorData: updatedVisitorData,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleClaimPlot",
      message: "Error claiming plot",
      req,
      res,
    });
  }
};
