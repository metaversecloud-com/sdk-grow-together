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
  getQueryString,
} from "../utils/index.js";
import {
  PlotAssetDataObjectType,
  InventoryItemType,
  VisitorInventoryItemType,
  WorldDataObjectType,
} from "../types/index.js";
import { calculateNumberOfSquares, s3URL } from "../../shared/index.js";
import { DroppedAssetClickType } from "@rtsdk/topia";

/**
 * Handle plot claiming - allows visitor to claim ownership of a plot
 * Each visitor can only claim one plot total
 */
export const handleClaimPlot = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, displayName, profileId, urlSlug } = credentials;

    const promises = [];

    const { visitor, visitorData, visitorInventory } = await initializeVisitorData(credentials);

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

    // Add free seed and starter tools to visitor's inventory if they don't already have it
    const name = "Carrots";
    if (!visitorInventory.seeds[name]) {
      // Throw error if Carrots doesn't exist in inventory for Public Key - user will not be able to do anything with their garden if they don't have any seeds to start with
      const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
        credentials,
        visitor,
        name,
        quantity: 1,
      });
      visitorInventory.seeds[name] = modifyInventoryItemResponse as InventoryItemType & VisitorInventoryItemType;
    }

    if (Object.keys(visitorInventory.tools).length === 0) {
      const starterPlotTools = ["Sprinkler", "Harvest Basket"];
      for (const name of starterPlotTools) {
        const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
          credentials,
          visitor,
          name,
          quantity: 1,
        });
        visitorInventory.tools[name] = modifyInventoryItemResponse as InventoryItemType & VisitorInventoryItemType;
      }

      const starterTools = ["Wooden Watering Can", "Basic Mulch", "Basic Compost"];
      for (const name of starterTools) {
        const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
          credentials,
          visitor,
          name,
          quantity: 5,
        });
        visitorInventory.tools[name] = modifyInventoryItemResponse as InventoryItemType & VisitorInventoryItemType;
      }
    }

    // Update plot asset's data object to mark ownership
    plotAssetData = {
      plotAssetId: assetId,
      ownerId: profileId,
      ownerName: displayName,
      claimedDate,
      lastInteractionDate: new Date().toISOString(),
    };
    promises.push(plotAsset.setDataObject(plotAssetData));

    // Update visitor's data object
    const plotData = {
      plotAssetId: plotAsset.id,
      claimedDate,
      plotSquares,
      crops: {},
      decorations: {},
    };

    const updatedVisitorData = {
      ...visitorData,
      worlds: {
        ...visitorData.worlds,
        [urlSlug]: plotData,
      },
    };

    promises.push(
      visitor.updateDataObject(updatedVisitorData, {
        analytics: [{ analyticName: "plotsClaimed", profileId, urlSlug, uniqueKey: profileId }],
      }),
    );

    // Update world data to add this plot to claimed plots and remove original assetId
    const world = await World.create(urlSlug, { credentials });
    const worldDataObject = (await world.fetchDataObject()) as WorldDataObjectType;
    delete worldDataObject.plots[assetId];

    promises.push(
      world.updateDataObject({
        plots: {
          ...worldDataObject.plots,
          [plotAsset.id!]: profileId,
        },
      }),
    );

    const title = `${displayName}'s Garden`;

    // Add owner text asset below the plot
    const asset = Asset.create("textAsset", { credentials });
    const droppedTextAsset = await DroppedAsset.drop(asset, {
      position: { x: plotAsset.position.x, y: plotAsset.position.y + 580 },
      isTextTopLayer: true,
      text: title,
      uniqueName: `GrowTogether_ownerText_${profileId}`,
      urlSlug,
    });

    const baseUrl = getBaseUrl(req.hostname);
    const clickableLink = `${baseUrl}/plot?ownerName=${encodeURIComponent(displayName)}&ownerProfileId=${profileId}`;
    promises.push(
      plotAsset.updateClickType({
        clickType: DroppedAssetClickType.LINK,
        clickableLink,
        clickableLinkTitle: title,
        isOpenLinkInDrawer: true,
      }),
    );
    promises.push(plotAsset.updateWebImageLayers("", `${s3URL}/ViewGardenSign.png`));

    await Promise.all(promises);

    await visitor
      .openIframe({
        droppedAssetId: assetId,
        link: `${clickableLink}&assetId=${droppedTextAsset.id!}}&isFirstTimeOpen=true&${getQueryString(credentials)}`,
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

    return res.json({
      success: true,
      plotAssetData,
      visitorData: updatedVisitorData,
      plotData,
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
