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
  modifyVisitorInventoryItem,
  getXpRewardAmount,
  getEarnedMessage,
  checkDidIncreaseLevelOrRank,
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
    const { seedName, squareId } = req.body;

    const { visitor, visitorData, visitorInventory } = await initializeVisitorData(credentials);

    // Get the plot asset and lock to prevent simultaneous plantings
    const plotAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    // Lock to prevent simultaneous plantings
    try {
      await plotAsset.updateDataObject(
        {},
        {
          lock: {
            lockId: `planting_${assetId}_${squareId}_${visitorId}_${Math.round(Date.now() / 5000) * 5000}`,
          },
        },
      );
    } catch (error) {
      return res.status(409).json({ message: "Seed already being planted." });
    }

    if (!seedName || !squareId) throw "Valid seedName and squareId are required";

    const noOfSquares = calculateNumberOfSquares();
    if (squareId < 1 || squareId > noOfSquares) throw `squareId must be between 1 and ${noOfSquares}`;

    // Get seed configuration
    const { ecosystemSeeds } = await getInventoryItems(credentials);

    const seedConfig = ecosystemSeeds[seedName];
    if (!seedConfig) throw "Invalid seed type";

    const plotData = visitorData.worlds[urlSlug];

    // Check if visitor owns this plot
    if (plotData.plotAssetId !== assetId) throw "You must own this plot before planting seeds";

    // Check if visitor has purchased this seed (for paid seeds)
    if (seedConfig.cost > 0 && !visitorInventory.seeds?.[seedConfig.name]) {
      throw "You must purchase this seed before planting";
    }

    // Check if the square is already occupied
    if (plotData.plotSquares?.[squareId]) throw "This square is already occupied";

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
        errorHandler({
          error,
          functionName: "handlePlantSeed",
          message: `Failed to trigger planting particle effect: ${error}`,
        });
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
      seedId: seedConfig.id,
      name: seedConfig.name,
      dateDropped: now,
      lastWatered: now,
      growLevel: 0,
      squareId,
      appliedTools: [],
    };

    visitorData.worlds[urlSlug].plotSquares[squareId] = cropAsset.id!;
    visitorData.worlds[urlSlug].crops[cropAsset.id!] = cropData;

    const xpRewardAmount = await getXpRewardAmount(seedConfig, "Plant");
    let coinsEarnedForRankUp = 0,
      didLevelUp = false;

    await Promise.all([
      cropAsset.setDataObject({
        ...cropData,
        plotAssetId: assetId,
        ownerId: profileId,
        ownerName: displayName,
      }),
      visitor.updateDataObject(visitorData, {
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
      }),
      modifyVisitorInventoryItem({
        credentials,
        visitor,
        name: "Experience Points",
        quantity: xpRewardAmount,
      }).then(async (modifyXpResponse) => {
        const checkResult = await checkDidIncreaseLevelOrRank(
          credentials,
          visitor,
          visitorInventory.xp,
          xpRewardAmount,
        );
        coinsEarnedForRankUp = checkResult.coinsEarnedForRankUp;
        didLevelUp = checkResult.didLevelUp;
        visitorInventory.xp = modifyXpResponse.quantity;
      }),
    ]);

    if (coinsEarnedForRankUp > 0) {
      const modifyCoinsResponse = await modifyVisitorInventoryItem({
        credentials,
        visitor,
        name: "Coins",
        quantity: coinsEarnedForRankUp,
      });
      visitorInventory.coins = modifyCoinsResponse.quantity;
    }

    const earnedMessage = await getEarnedMessage(coinsEarnedForRankUp, xpRewardAmount);

    return res.json({
      success: true,
      visitorData,
      plotData: visitorData.worlds[urlSlug],
      earnedMessage,
      soundEffect: "plant",
      didLevelUp,
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
