import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  calculateSquarePosition,
  DroppedAsset,
  Asset,
  World,
} from "../utils/index.js";
import { calculateNumberOfSquares, decorations } from "../../shared/index.js";

/**
 * Handle placing a decoration - creates a new decoration dropped asset in the world
 */
export const handlePlaceDecoration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, displayName, urlSlug, visitorId, profileId } = credentials;
    const { decorationId, squareIndex } = req.body;

    if (!decorationId || typeof decorationId !== "number" || typeof squareIndex !== "number") {
      return res.status(400).json({
        success: false,
        error: "Valid decorationId and squareIndex are required",
      });
    }

    const noOfSquares = calculateNumberOfSquares(true);
    if (squareIndex < 0 || squareIndex > noOfSquares) {
      return res.status(400).json({
        success: false,
        error: `squareIndex must be between 0 and ${noOfSquares}`,
      });
    }

    const decoration = decorations[decorationId];

    // Verify decoration exists
    if (!decoration) {
      return res.status(400).json({
        success: false,
        error: "Invalid decoration type",
      });
    }

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if visitor owns a plot
    if (!visitorPlotData.plotAssetId) {
      return res.status(400).json({
        success: false,
        error: "You must claim a plot before placing decorations",
      });
    }

    // Check if visitor owns this decoration
    if (!visitorData.decorationsOwned[decorationId] || visitorData.decorationsOwned[decorationId].available < 1) {
      return res.status(400).json({
        success: false,
        error: "You must own this decoration before placing",
      });
    }

    // Check if the square is already occupied
    if (visitorPlotData.plotSquares?.[squareIndex]) {
      return res.status(400).json({
        success: false,
        error: "This square is already occupied",
      });
    }

    // Get the plot asset to determine position
    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    const position = calculateSquarePosition(plotAsset.position, squareIndex);

    // Trigger particle effect
    const world = World.create(urlSlug, { credentials });
    await world
      .triggerParticle({
        name: "lightBlueSmoke_puff",
        duration: 2,
        position,
      })
      .catch((error) => {
        console.error("Failed to trigger placing particle effect:", error);
      });

    const asset = Asset.create("webImageAsset", { credentials });

    // Drop a new decoration asset at the calculated position
    const decorationAsset = await DroppedAsset.drop(asset, {
      layer1: decoration.imageSrc,
      position,
      uniqueName: `BountyBuilders_decoration_${profileId}`,
      urlSlug,
    });

    const now = new Date().toISOString();
    const decorationData = {
      dateDropped: now,
      id: decorationId,
    };

    await decorationAsset.setDataObject({
      ...decorationData,
      ownerId: profileId,
      ownerName: displayName,
    });

    // Update visitor's data object
    visitorData.decorationsOwned[decorationId].available =
      (visitorData.decorationsOwned[decorationId].available || 0) - 1;
    visitorData.worlds[urlSlug].plotSquares[squareIndex] = decorationAsset.id!;
    visitorData.worlds[urlSlug].decorations[decorationAsset.id!] = decorationData;

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "decorationPlaced",
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
      ],
    });

    return res.json({
      success: true,
      visitorData,
      visitorPlotData: visitorData.worlds[urlSlug],
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
