import { DroppedAssetInterface } from "@rtsdk/topia";
import { DroppedAsset, World, standardizedError } from "./index.js";
import { Credentials } from "../types/Credentials.js";
import { PlotAssetDataObjectType, WorldDataObjectType } from "../types/index.js";

export const getPlotAssets = async (
  credentials: Credentials,
  shouldReset?: boolean,
): Promise<WorldDataObjectType | Error> => {
  try {
    const { urlSlug } = credentials;

    const world = await World.create(urlSlug, { credentials });
    const worldDataObject = (await world.fetchDataObject()) as WorldDataObjectType;

    let claimedPlots = worldDataObject?.claimedPlots || {};

    if (shouldReset || !worldDataObject?.claimedPlots || Object.keys(worldDataObject?.claimedPlots).length === 0) {
      const plotAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "GrowTogether_plot",
      });

      if (plotAssets.length === 0) throw "No plot assets found.";

      // Process all plot assets in parallel and wait for all to complete
      const plotDataPromises = plotAssets.map(async (asset) => {
        const plotAsset = await DroppedAsset.create(asset.id!, urlSlug, {
          credentials: { ...credentials, assetId: asset.id! },
        });
        await plotAsset.fetchDataObject();

        const plotAssetData = plotAsset.dataObject as PlotAssetDataObjectType;

        // Return the asset ID and owner ID (or null if not owned)
        return {
          assetId: asset.id!,
          ownerId: plotAssetData?.ownerId || null,
        };
      });

      // Wait for all promises to resolve
      const plotDataResults = await Promise.all(plotDataPromises);

      // Build the claimedPlots object from the results
      claimedPlots = plotDataResults.reduce<{ [key: string]: string | null }>((acc, result) => {
        acc[result.assetId] = result.ownerId;
        return acc;
      }, {});

      await world.setDataObject(
        {
          claimedPlots,
        },
        {
          lock: { lockId: `world_plotAssets_${Math.floor(Date.now() / 60000) * 60000}`, releaseLock: true },
        },
      );
    }

    return { claimedPlots };
  } catch (error: any) {
    return standardizedError(error);
  }
};
