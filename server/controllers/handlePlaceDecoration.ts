import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  calculateSquarePosition,
  DroppedAsset,
  Asset,
  World,
  getBaseUrl,
  getInventoryItems,
  modifyVisitorInventoryItem,
  getAnalyticName,
} from "../utils/index.js";
import { calculateNumberOfSquares, getDecorationImageVariation } from "../../shared/index.js";
import { DroppedAssetClickType } from "@rtsdk/topia";

/**
 * Handle placing a decoration - creates a new decoration dropped asset in the world
 */
export const handlePlaceDecoration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, displayName, profileId, urlSlug, visitorId } = credentials;
    const { decorationId, squareId } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    // Get the plot asset and lock to prevent simultaneous placements
    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    try {
      await plotAsset.updateDataObject(
        {},
        {
          lock: {
            lockId: `placing_${assetId}_${squareId}_${visitorId}_${Math.round(Date.now() / 5000) * 5000}`,
          },
        },
      );
    } catch (error) {
      return res.status(409).json({ message: "Decoration already being placed." });
    }

    if (!decorationId || !squareId) throw "Valid decorationId and squareId are required";

    const noOfSquares = calculateNumberOfSquares();
    if (squareId < 0 || squareId > noOfSquares) {
      throw `squareId must be between 0 and ${noOfSquares}`;
    }

    // Get decorations configuration
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { decorations } = getInventoryItemsResponse;

    const decoration = decorations[decorationId];

    // Verify decoration exists
    if (!decoration) throw "Invalid decoration type";

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if visitor owns a plot
    if (!visitorPlotData.plotAssetId) throw "You must claim a plot before placing decorations";

    // Check if visitor owns this decoration
    if (!visitorInventory[decoration.name] || visitorInventory[decoration.name].quantity < 1) {
      throw "You must own this decoration before placing it";
    }

    // Check if the square is already occupied
    if (visitorPlotData.plotSquares?.[squareId]) throw "This square is already occupied";

    // Use the plot asset to determine position
    const position = calculateSquarePosition(plotAsset.position, squareId);

    // Trigger particle effect
    const world = World.create(urlSlug, { credentials });
    await world
      .triggerParticle({
        name: "dirt_grow_together",
        duration: 1,
        position,
      })
      .catch((error) => {
        console.error("Failed to trigger placing particle effect:", error);
      });

    const asset = Asset.create("webImageAsset", { credentials });

    // Drop a new decoration asset at the calculated position
    const baseUrl = getBaseUrl(req.hostname);
    const layer1 = getDecorationImageVariation(decoration.name);
    const decorationAsset = await DroppedAsset.drop(asset, {
      clickType: DroppedAssetClickType.LINK,
      clickableLink: `${baseUrl}/decoration?ownerName=${encodeURIComponent(displayName)}&ownerProfileId=${profileId}`,
      clickableLinkTitle: decoration.name,
      isInteractive: true,
      interactivePublicKey: credentials.interactivePublicKey,
      isOpenLinkInDrawer: true,
      layer1,
      position,
      uniqueName: `GrowTogether_decoration_${profileId}`,
      urlSlug,
    });

    const now = new Date().toISOString();
    const decorationData = {
      dateDropped: now,
      decorationId: decorationId,
      decorationName: decoration.name,
      squareId,
    };

    await decorationAsset.setDataObject({
      ...decorationData,
      ownerId: profileId,
      ownerName: displayName,
    });

    // Deduct the decoration from visitor's inventory
    const modifyInventoryItemResponse = await modifyVisitorInventoryItem({
      credentials,
      visitor,
      name: decoration.name,
      quantity: -1,
    });
    if (typeof modifyInventoryItemResponse === "number") {
      visitorInventory[decoration.name].quantity = modifyInventoryItemResponse;
    } else {
      console.log("Error while modifying inventory item:", modifyInventoryItemResponse);
    }

    // Update visitor's data object
    visitorData.worlds[urlSlug].plotSquares[squareId] = decorationAsset.id!;
    visitorData.worlds[urlSlug].decorations[decorationAsset.id!] = decorationData;

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "decorationsAdded",
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
        {
          analyticName: `${getAnalyticName(decoration)}Added`,
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
      ],
    });

    return res.json({
      success: true,
      visitorPlotData: visitorData.worlds[urlSlug],
      visitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handlePlaceDecoration",
      message: "Error placing decoration",
      req,
      res,
    });
  }
};
