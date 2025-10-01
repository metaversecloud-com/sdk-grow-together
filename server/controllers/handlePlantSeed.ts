import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  getSeedConfig,
  getPlantImageUrl,
  calculateSquarePosition,
  DroppedAsset,
  Asset,
  World,
  getBaseUrl,
} from "../utils/index.js";
import { DroppedAssetClickType } from "@rtsdk/topia";
import { calculateNumberOfSquares } from "../../shared/index.js";

/**
 * Handle planting a seed - creates a new plant dropped asset in the world
 */
export const handlePlantSeed = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, displayName, profileId, urlSlug, visitorId } = credentials;
    const { seedId, squareIndex } = req.body;

    if (!seedId || typeof seedId !== "number" || typeof squareIndex !== "number") {
      return res.status(400).json({
        success: false,
        error: "Valid seedId and squareIndex are required",
      });
    }

    const noOfSquares = calculateNumberOfSquares(true);
    if (squareIndex < 0 || squareIndex > noOfSquares) {
      return res.status(400).json({
        success: false,
        error: `squareIndex must be between 0 and ${noOfSquares}`,
      });
    }

    // Get seed configuration
    const seedConfig = getSeedConfig(seedId);
    if (!seedConfig) {
      return res.status(400).json({
        success: false,
        error: "Invalid seed type",
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
        error: "You must claim a plot before planting seeds",
      });
    }

    // Check if visitor has purchased this seed (for paid seeds)
    if (seedConfig.cost > 0 && !visitorData.seedsPurchased[seedId]) {
      return res.status(400).json({
        success: false,
        error: "You must purchase this seed before planting",
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
    const layer1 = getPlantImageUrl(seedId, 0); // Start at growth level 0

    // Trigger planting particle effect
    const world = World.create(urlSlug, { credentials });
    await world
      .triggerParticle({
        name: "lightBlueSmoke_puff",
        duration: 2,
        position,
      })
      .catch((error) => {
        console.error("Failed to trigger planting particle effect:", error);
      });

    const asset = Asset.create("webImageAsset", { credentials });

    // Drop a new plant asset at the calculated position
    const baseUrl = getBaseUrl(req.hostname);
    const plantAsset = await DroppedAsset.drop(asset, {
      assetScale: 1.8,
      clickType: DroppedAssetClickType.LINK,
      clickableLink: `${baseUrl}/plant?ownerName=${encodeURIComponent(displayName)}&ownerProfileId=${profileId}`,
      clickableLinkTitle: seedConfig.name,
      isInteractive: true,
      interactivePublicKey: credentials.interactivePublicKey,
      isOpenLinkInDrawer: true,
      layer1,
      position,
      uniqueName: `BountyBuilders_plant_${profileId}`,
      urlSlug,
    });

    const now = new Date().toISOString();
    const plantData = {
      dateDropped: now,
      lastWatered: now,
      seedId,
      growLevel: 0,
      squareIndex,
    };

    await plantAsset.setDataObject({
      ...plantData,
      ownerId: profileId,
      ownerName: displayName,
    });

    // Update visitor's data object
    visitorData.worlds[urlSlug].plotSquares[squareIndex] = plantAsset.id!;
    visitorData.worlds[urlSlug].plants[plantAsset.id!] = plantData;

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "seedPlanted",
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
      functionName: "handlePlantSeed",
      message: "Error planting seed",
      req,
      res,
    });
  }
};
