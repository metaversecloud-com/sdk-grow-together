import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  Ecosystem,
  modifyInventoryItem,
} from "../utils/index.js";
import { PlotAssetDataObjectType, WorldDataObjectType } from "../types/index.js";
import { calculateNumberOfSquares } from "../../shared/index.js";

/**
 * Handle plot claiming - allows visitor to claim ownership of a plot
 * Each visitor can only claim one plot total
 */
export const handleClaimPlot = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, profileId, displayName } = credentials;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    if (visitorData.worlds[urlSlug].plotAssetId) {
      throw "You already own a plot. Each player can only claim one plot.";
    }

    // Check if this plot is already claimed by someone else
    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    await plotAsset.fetchDataObject();

    let plotAssetData = plotAsset.dataObject as PlotAssetDataObjectType;

    if (plotAssetData?.ownerId && plotAssetData.ownerId !== profileId) {
      throw `This plot is already owned by ${plotAssetData.ownerName || "another player"}.`;
    }

    // Claim the plot
    const claimedDate = new Date().toISOString();

    // Initialize empty grid
    const noOfSquares = calculateNumberOfSquares();
    const plotSquares: { [key: number]: string | null } = {};
    for (let i = 1; i <= noOfSquares; i++) {
      plotSquares[i] = null;
    }

    // Update visitor's data object
    const visitorPlotData = {
      plotAssetId: assetId,
      claimedDate,
      plotSquares,
      crops: {},
      decorations: {},
    };

    await visitor.updateDataObject(
      { [`worlds.${urlSlug}`]: visitorPlotData },
      {
        analytics: [{ analyticName: "plotClaimed", profileId, urlSlug, uniqueKey: profileId }],
      },
    );

    // Add free seed to visitor's inventory
    const name = "Carrots";
    const modifyInventoryItemResponse = await modifyInventoryItem({
      credentials,
      visitor,
      name,
      quantity: 1,
    });
    if (modifyInventoryItemResponse instanceof Error) throw modifyInventoryItemResponse;
    visitorInventory[name] = { id: name, quantity: modifyInventoryItemResponse };

    // Update plot asset's data object to mark ownership
    plotAssetData = {
      ownerId: profileId,
      ownerName: displayName,
      claimedDate,
    };
    await Promise.all([
      plotAsset.setDataObject(plotAssetData),
      plotAsset.updateCustomTextAsset({}, `${displayName}'s Plot`),
    ]);

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
      visitorInventory,
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
