import { Request, Response } from "express";
import { errorHandler, getCredentials, initializeVisitorData, Visitor, DroppedAsset, World } from "../utils/index.js";
import { PlotAssetDataObjectType, WorldDataObjectType } from "../types/index.js";
import { calculateNumberOfSquares, decorations } from "../../shared/index.js";

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
    if (visitorData instanceof Error) throw visitorData;

    if (visitorData.worlds[urlSlug].ownedPlot) {
      return res.status(400).json({
        success: false,
        error: "You already own a plot. Each player can only claim one plot.",
      });
    }

    // Check if this plot is already claimed by someone else
    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    await plotAsset.fetchDataObject();

    let plotAssetData = plotAsset.dataObject as PlotAssetDataObjectType;

    if (plotAssetData?.ownerId && plotAssetData.ownerId !== profileId) {
      return res.status(400).json({
        success: false,
        error: `This plot is already owned by ${plotAssetData.ownerName || "another player"}.`,
      });
    }

    // Claim the plot
    const claimedDate = new Date().toISOString();

    // Initialize empty grid
    const noOfSquares = calculateNumberOfSquares(false);
    const plotSquares: { [key: number]: string | null } = {};
    for (let i = 0; i < noOfSquares; i++) {
      plotSquares[i] = null;
    }

    // Update visitor's data object
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    const visitorPlotData = {
      ownedPlot: {
        plotAssetId: assetId,
        claimedDate,
        plotSquares,
      },
      plants: {},
      decorations: {},
    };

    await visitor.updateDataObject(
      { [`worlds.${urlSlug}`]: visitorPlotData },
      {
        analytics: [{ analyticName: "plotClaimed" }],
      },
    );

    // Update plot asset's data object to mark ownership
    plotAssetData = {
      ownerId: profileId,
      ownerName: displayName,
      claimedDate,
    };
    await plotAsset.setDataObject(plotAssetData);

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

    const world = await World.create(urlSlug, { credentials });
    const worldDataObject = (await world.fetchDataObject()) as WorldDataObjectType;
    await world.updateDataObject({
      claimedPlots: {
        ...worldDataObject.claimedPlots,
        [assetId]: profileId,
      },
    });

    const updatedVisitorData = {
      ...visitorData,
      worlds: {
        ...visitorData.worlds,
        [urlSlug]: visitorPlotData,
      },
    };

    return res.json({
      success: true,
      plotAssetData,
      visitorData: updatedVisitorData,
      visitorPlotData,
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
