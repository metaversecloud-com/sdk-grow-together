import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  initializeVisitorData,
  getSeedConfig,
  getPlantImageUrl,
  calculateSquarePosition,
  Visitor,
  DroppedAsset,
  Asset,
  World,
  getBaseUrl,
} from "../utils/index.js";
import { DroppedAssetClickType } from "@rtsdk/topia";

/**
 * Handle planting a seed - creates a new plant dropped asset in the world
 */
export const handlePlantSeed = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { displayName, urlSlug, visitorId, profileId } = credentials;
    const { seedId, squareIndex } = req.body;

    if (!seedId || typeof seedId !== "number" || typeof squareIndex !== "number") {
      return res.status(400).json({
        success: false,
        error: "Valid seedId and squareIndex are required",
      });
    }

    if (squareIndex < 0 || squareIndex > 15) {
      return res.status(400).json({
        success: false,
        error: "squareIndex must be between 0 and 15",
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

    // Initialize visitor data
    const visitorData = await initializeVisitorData(credentials);
    if (visitorData instanceof Error) throw visitorData;

    // Check if visitor owns a plot
    if (!visitorData.ownedPlot) {
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
    if (visitorData.ownedPlot.plotSquares[squareIndex]) {
      return res.status(400).json({
        success: false,
        error: "This square is already occupied",
      });
    }

    // Get the plot asset to determine position
    const plotAsset = await DroppedAsset.get(visitorData.ownedPlot.plotAssetId, urlSlug, { credentials });
    const plantPosition = calculateSquarePosition(plotAsset.position, squareIndex);

    // Create the plant dropped asset in the world
    const world = World.create(urlSlug, { credentials });
    const plantImageUrl = getPlantImageUrl(seedId, 0); // Start at growth level 0

    // Get the original plot asset to use as base for creating new plant asset
    const asset = Asset.create("webImageAsset", { credentials });

    // Drop a new plant asset at the calculated position
    const baseUrl = getBaseUrl(req.hostname);
    const newPlantAsset = await DroppedAsset.drop(asset, {
      assetScale: 1.8,
      clickType: DroppedAssetClickType.LINK,
      clickableLink: `${baseUrl}/plant?ownerName=${encodeURIComponent(displayName)}&ownerProfileId=${profileId}`,
      clickableLinkTitle: seedConfig.name,
      isInteractive: true,
      interactivePublicKey: credentials.interactivePublicKey,
      isOpenLinkInDrawer: true,
      layer1: plantImageUrl,
      position: plantPosition,
      uniqueName: `BountyBuilders_plant_${profileId}`,
      urlSlug,
    });

    const plantAssetId = newPlantAsset.id;
    const now = new Date().toISOString();
    const plantData = {
      dateDropped: now,
      lastWatered: now,
      seedId,
      growLevel: 0,
      squareIndex,
      wasHarvested: false,
    };

    await newPlantAsset.setDataObject({
      ...plantData,
      ownerId: profileId,
      ownerName: displayName,
    });

    // Trigger planting particle effect
    try {
      await world.triggerParticle({
        name: "Sparkle",
        duration: 2,
        position: plantPosition,
      });
    } catch (error) {
      console.error("Failed to trigger planting particle effect:", error);
    }

    // Update visitor's data object
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    const updatedVisitorData = {
      ...visitorData,
      ownedPlot: {
        ...visitorData.ownedPlot!,
        plotSquares: {
          ...visitorData.ownedPlot!.plotSquares,
          [`${squareIndex}`]: plantAssetId,
        },
      },
      plants: {
        ...visitorData.plants,
        [plantAssetId!]: plantData,
      },
    };

    await visitor.updateDataObject(
      { [urlSlug]: updatedVisitorData },
      {
        analytics: [
          {
            analyticName: "seed_planted",
          },
        ],
      },
    );

    return res.json({
      success: true,
      data: { droppedAssetId: plantAssetId },
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
