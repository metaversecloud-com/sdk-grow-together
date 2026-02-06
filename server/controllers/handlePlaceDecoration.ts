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
    const { decorationName, squareId } = req.body;

    const { visitor, visitorData, visitorInventory } = await initializeVisitorData(credentials);
    const { decorations: visitorDecorations } = visitorInventory;

    // Get the plot asset and lock to prevent simultaneous placements
    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    // Lock to prevent simultaneous placements
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

    if (!decorationName || !squareId) throw "Valid decorationName and squareId are required";

    const noOfSquares = calculateNumberOfSquares();
    if (squareId < 0 || squareId > noOfSquares) {
      throw `squareId must be between 0 and ${noOfSquares}`;
    }

    // Get decorations configuration
    const { ecosystemDecorations } = await getInventoryItems(credentials);

    const decoration = ecosystemDecorations[decorationName];

    // Verify decoration exists
    if (!decoration) throw "Invalid decoration type";

    const plotData = visitorData.worlds[urlSlug];

    // Check if visitor owns this plot
    if (plotData.plotAssetId !== assetId) throw "You must own this plot before placing decorations";

    // Check if visitor owns this decoration
    if (
      !visitorDecorations?.[decoration.name] ||
      !visitorDecorations?.[decoration.name] ||
      visitorDecorations[decoration.name].quantity < 1
    ) {
      throw "You must own this decoration before placing it";
    }

    // Check if the square is already occupied
    if (plotData.plotSquares?.[squareId]) throw "This square is already occupied";

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
        errorHandler({
          error,
          functionName: "handlePlaceDecoration",
          message: `Failed to trigger placing particle effect: ${error}`,
        });
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
    if (!decorationAsset.id) throw "Failed to place decoration asset";

    const now = new Date().toISOString();
    const decorationData = {
      dateDropped: now,
      decorationId: decoration.id,
      decorationName: decoration.name,
      squareId,
    };

    await decorationAsset.setDataObject({
      ...decorationData,
      plotAssetId: assetId,
      ownerId: profileId,
      ownerName: displayName,
    });

    // Update visitor's data object
    visitorData.worlds[urlSlug].plotSquares[squareId] = decorationAsset.id;
    visitorData.worlds[urlSlug].decorations[decorationAsset.id] = decorationData;

    if (!visitorData.placedDecorations[decoration.name]) {
      visitorData.placedDecorations[decoration.name] = { [urlSlug]: [decorationAsset.id] };
    } else if (!visitorData.placedDecorations[decoration.name][urlSlug]) {
      visitorData.placedDecorations[decoration.name][urlSlug] = [decorationAsset.id];
    } else {
      visitorData.placedDecorations[decoration.name][urlSlug].push(decorationAsset.id);
    }

    if (visitorDecorations[decoration.name]) visitorDecorations[decoration.name].availableQuantity -= 1;

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
      plotData: visitorData.worlds[urlSlug],
      visitorInventory,
      soundEffect: "placeDecoration",
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
