import {
  errorHandler,
  DroppedAsset,
  World,
  getInventoryItems,
  getAnalyticName,
  getXpRewardAmount,
  standardizeError,
  modifyVisitorInventoryItem,
} from "../index.js";
import {
  CropDataObjectType,
  getSecondsRemaining,
  getSeedConfig,
  getSeedImageVariation,
  plotConfig,
  VisitorDataObjectType,
  VisitorWorldDataType,
} from "../../../shared/index.js";
import { Credentials } from "../../types/index.js";
import { UserInterface, VisitorInterface } from "@rtsdk/topia";

/**
 * Handle crop watering - grows crop by 1 level and updates dropped asset image in world
 */
export const waterCrop = async ({
  credentials,
  owner,
  ownerData,
  assetId,
  shouldReward = false,
  analytics = [],
}: {
  credentials: Credentials;
  owner: VisitorInterface | UserInterface;
  ownerData: VisitorDataObjectType;
  assetId: string;
  shouldReward?: boolean;
  analytics?: Array<{ analyticName: string; profileId: string; urlSlug?: string; uniqueKey: string }>;
}): Promise<{
  success: boolean;
  visitorData: VisitorDataObjectType;
  plotData: VisitorWorldDataType;
  cropData?: CropDataObjectType;
  xpRewardAmount?: number;
  totalXp?: number;
}> => {
  try {
    const { profileId, urlSlug } = credentials;
    const plotData = ownerData.worlds[urlSlug];

    // Check if the crop exists in owner's data
    const crop = plotData.crops[assetId];
    if (!crop) throw "Crop not found";

    // Lock to prevent simultaneous waterings
    try {
      await owner.updateDataObject(
        {},
        {
          lock: {
            lockId: `watering_${assetId}_${Math.round(Date.now() / 30000) * 30000}`,
          },
        },
      );
    } catch (error) {
      throw "Crop is already being watered.";
    }

    // Get seed configuration for harvest level and reward calculation
    const { ecosystemSeeds } = await getInventoryItems(credentials);

    const seedConfig = getSeedConfig(ecosystemSeeds, crop);
    if (!seedConfig) throw "Invalid crop type";

    if (crop.growLevel >= seedConfig.harvestLevel) throw "Crop is already fully grown";

    const remainingSeconds = getSecondsRemaining(crop.lastWatered, seedConfig.growthTime, crop.appliedTools || []);
    if (remainingSeconds > 0)
      throw `Crop is still growing. Please wait ${remainingSeconds} seconds before watering again.`;

    let cropAsset;
    try {
      cropAsset = await DroppedAsset.get(assetId, urlSlug, { credentials: { ...credentials, assetId } });
    } catch (error) {
      console.error("Crop asset no longer in world. Continuing to clean up data object.");

      ownerData.worlds[urlSlug].plotSquares[crop.squareId] = null;
      delete ownerData.worlds[urlSlug].crops[assetId];

      await owner.updateDataObject(ownerData, {});

      return {
        success: false,
        visitorData: ownerData,
        plotData: ownerData.worlds[urlSlug],
      };
    }

    const cropData = {
      ...crop,
      growLevel: crop.growLevel + 1,
      lastWatered: new Date().toISOString(),
    };

    // Update owner's data object
    ownerData.worlds[urlSlug].crops[assetId] = cropData;

    const world = World.create(urlSlug, { credentials });

    analytics.push(
      {
        analyticName: "cropsWatered",
        profileId,
        urlSlug,
        uniqueKey: profileId,
      },
      {
        analyticName: `${getAnalyticName(seedConfig)}Watered`,
        profileId,
        urlSlug,
        uniqueKey: profileId,
      },
    );
    await Promise.all([
      owner.updateDataObject(ownerData, {
        analytics,
      }),
      world
        .triggerParticle({
          name: "drop_grow_together",
          duration: 1,
          position: {
            x: cropAsset.position.x - plotConfig.squareSpacing / 2,
            y: cropAsset.position.y - 200,
          },
        })
        .catch((error) => {
          errorHandler({
            error,
            functionName: "handleWaterCrop",
            message: `Failed to trigger water particle effect: ${error}`,
          });
        }),
      cropAsset.fetchDataObject(),
    ]);

    const cropAssetData = cropAsset.dataObject as CropDataObjectType;

    // update the crop data on the asset
    await cropAsset.updateDataObject({ ...cropAssetData, ...cropData });

    // Update the crop asset image to reflect new growth level
    const layer1 = getSeedImageVariation(seedConfig.name, crop.growLevel + 1);
    await cropAsset.updateWebImageLayers("", layer1).catch((error) => {
      errorHandler({
        error,
        functionName: "handleWaterCrop",
        message: `Failed to update crop asset ${assetId}: ${error}`,
      });
    });

    let xpRewardAmount, totalXp;
    if (shouldReward) {
      // Grant xp to visitor if they own the plot
      xpRewardAmount = await getXpRewardAmount(seedConfig, "Water");
      const modifyXpResponse = await modifyVisitorInventoryItem({
        credentials,
        visitor: owner as VisitorInterface,
        name: "Experience Points",
        quantity: xpRewardAmount,
      });
      totalXp = modifyXpResponse.quantity;
    }

    return {
      success: true,
      cropData: { ...cropAssetData, ...cropData },
      visitorData: ownerData,
      plotData: ownerData.worlds[urlSlug],
      xpRewardAmount,
      totalXp,
    };
  } catch (error: any) {
    throw standardizeError(error);
  }
};
