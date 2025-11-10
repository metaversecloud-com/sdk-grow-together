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
import { DroppedAssetClickType } from "@rtsdk/topia";
import { calculateNumberOfSquares, getSeedImageVariation } from "../../shared/index.js";

/**
 * Handle planting a seed - creates a new crop dropped asset in the world
 */
export const handlePlantSeed = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, displayName, profileId, urlSlug, visitorId } = credentials;
    const { seedId, squareId } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    // Get the plot asset and lock to prevent simultaneous plantings
    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    try {
      await plotAsset.updateDataObject(
        {},
        {
          lock: {
            lockId: `planting_${assetId}_${squareId}_${visitorId}_${Math.floor(Date.now() / 10000) * 10000}`,
          },
        },
      );
    } catch (error) {
      return res.status(409).json({ message: "Seed already being planted." });
    }

    if (!seedId || !squareId) throw "Valid seedId and squareId are required";

    const noOfSquares = calculateNumberOfSquares();
    if (squareId < 1 || squareId > noOfSquares) throw `squareId must be between 1 and ${noOfSquares}`;

    // Get seed configuration
    const getInventoryItemsResponse = await getInventoryItems(credentials);
    if (getInventoryItemsResponse instanceof Error) throw getInventoryItemsResponse;

    const { seeds } = getInventoryItemsResponse;

    const seedConfig = seeds[seedId];
    if (!seedConfig) throw "Invalid seed type";

    const visitorPlotData = visitorData.worlds[urlSlug];

    // Check if visitor owns a plot
    if (!visitorPlotData.plotAssetId) throw "You must claim a plot before planting seeds";

    // Check if visitor has purchased this seed (for paid seeds)
    if (seedConfig.cost > 0 && !visitorInventory[seedConfig.name]) {
      throw "You must purchase this seed before planting";
    }

    // Check if the square is already occupied
    if (visitorPlotData.plotSquares?.[squareId]) throw "This square is already occupied";

    // Use the plot asset to determine position
    const position = calculateSquarePosition(plotAsset.position, squareId);
    const layer1 = getSeedImageVariation(seedConfig.name, 0); // Start at growth level 0

    // Trigger planting particle effect
    const world = World.create(urlSlug, { credentials });
    await world
      .triggerParticle({
        name: "dirt_grow_together",
        duration: 1,
        position,
      })
      .catch((error) => {
        console.error("Failed to trigger planting particle effect:", error);
      });

    const asset = Asset.create("webImageAsset", { credentials });

    // Drop a new crop asset at the calculated position
    const baseUrl = getBaseUrl(req.hostname);
    const cropAsset = await DroppedAsset.drop(asset, {
      clickType: DroppedAssetClickType.LINK,
      clickableLink: `${baseUrl}/crop?ownerName=${encodeURIComponent(displayName)}&ownerProfileId=${profileId}`,
      clickableLinkTitle: seedConfig.name,
      isInteractive: true,
      interactivePublicKey: credentials.interactivePublicKey,
      isOpenLinkInDrawer: true,
      layer1,
      position,
      uniqueName: `GrowTogether_crop_${profileId}`,
      urlSlug,
    });

    const now = new Date().toISOString();
    const cropData = {
      dateDropped: now,
      lastWatered: now,
      seedId,
      growLevel: 0,
      squareId,
    };

    await cropAsset.setDataObject({
      ...cropData,
      ownerId: profileId,
      ownerName: displayName,
    });

    // Update visitor's data object
    visitorData.worlds[urlSlug].plotSquares[squareId] = cropAsset.id!;
    visitorData.worlds[urlSlug].crops[cropAsset.id!] = cropData;

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "cropsPlanted",
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
        {
          analyticName: `${getAnalyticName(seedConfig)}Planted`,
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
