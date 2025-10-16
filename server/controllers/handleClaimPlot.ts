import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  DroppedAsset,
  World,
  modifyVisitorInventoryItem,
  getBaseUrl,
  Asset,
} from "../utils/index.js";
import { PlotAssetDataObjectType, WorldDataObjectType } from "../types/index.js";
import { calculateNumberOfSquares } from "../../shared/index.js";
import { DroppedAssetClickType } from "@rtsdk/topia";

/**
 * Handle plot claiming - allows visitor to claim ownership of a plot
 * Each visitor can only claim one plot total
 */
export const handleClaimPlot = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, displayName, interactiveNonce, interactivePublicKey, profileId, urlSlug, visitorId } = credentials;

    const promises = [];

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

    const title = `${displayName}'s Plot`;

    const asset = Asset.create("textAsset", { credentials });
    const baseUrl = getBaseUrl(req.hostname);
    const clickableLink = `${baseUrl}/plot?ownerName=${encodeURIComponent(displayName)}&ownerProfileId=${profileId}`;
    const droppedTextAsset = await DroppedAsset.drop(asset, {
      clickType: DroppedAssetClickType.LINK,
      clickableLink,
      clickableLinkTitle: title,
      isInteractive: true,
      interactivePublicKey: credentials.interactivePublicKey,
      isOpenLinkInDrawer: true,
      position: plotAsset.position,
      isTextTopLayer: true,
      text: title,
      uniqueName: `GrowTogether_plot`,
      urlSlug,
    });

    // Claim the plot
    const claimedDate = new Date().toISOString();

    // Initialize empty grid
    const noOfSquares = calculateNumberOfSquares();
    const plotSquares: { [key: number]: string | null } = {};
    for (let i = 1; i <= noOfSquares; i++) {
      plotSquares[i] = null;
    }

    // Add free seed to visitor's inventory if they don't already have it
    const name = "Carrots";
    if (!visitorInventory[name]) {
      const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
        credentials,
        visitor,
        name,
        quantity: 1,
      });
      // Throw error if Carrots doesn't exist in inventory for Public Key - user will not be able to do anything with their garden if they don't have any seeds to start with
      if (modifyInventoryItemResponse instanceof Error) throw modifyInventoryItemResponse;
      visitorInventory[name] = { id: name, quantity: modifyInventoryItemResponse };
    }

    // Update plot asset's data object to mark ownership
    plotAssetData = {
      ownerId: profileId,
      ownerName: displayName,
      claimedDate,
    };
    promises.push(droppedTextAsset.setDataObject(plotAssetData));

    // Update visitor's data object
    const visitorPlotData = {
      plotAssetId: droppedTextAsset.id,
      claimedDate,
      plotSquares,
      crops: {},
      decorations: {},
    };

    promises.push(
      visitor.updateDataObject(
        { [`worlds.${urlSlug}`]: visitorPlotData },
        {
          analytics: [{ analyticName: "plotsClaimed", profileId, urlSlug, uniqueKey: profileId }],
        },
      ),
    );

    // Update world data to add this plot to claimed plots and remove original assetId
    const world = await World.create(urlSlug, { credentials });
    const worldDataObject = (await world.fetchDataObject()) as WorldDataObjectType;
    delete worldDataObject.claimedPlots[assetId];

    promises.push(
      world.updateDataObject({
        claimedPlots: {
          ...worldDataObject.claimedPlots,
          [droppedTextAsset.id!]: profileId,
        },
      }),
    );

    const updatedVisitorData = {
      ...visitorData,
      worlds: {
        ...visitorData.worlds,
        [urlSlug]: visitorPlotData,
      },
    };

    await Promise.all(promises);

    await visitor
      .openIframe({
        droppedAssetId: droppedTextAsset.id!,
        link: `${clickableLink}&assetId=${droppedTextAsset.id!}`,
        shouldOpenInDrawer: true,
        title,
      })
      .catch(async (error: any) => {
        errorHandler({
          error,
          functionName: "handleClaimPlot",
          message: "Error opening iframe",
        });
        // if open fails, close the original iframe as it'll no longer work once the original asset is deleted
        await visitor.closeIframe(assetId).catch((error: any) => {
          return errorHandler({
            error,
            functionName: "handleClaimPlot",
            message: "Error closing iframe",
          });
        });
      });

    await plotAsset.deleteDroppedAsset();

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
