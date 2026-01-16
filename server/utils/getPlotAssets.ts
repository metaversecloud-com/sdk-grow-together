import { DroppedAssetInterface } from "@rtsdk/topia";
import { DroppedAsset, World, standardizeError } from "./index.js";
import { Credentials } from "../types/Credentials.js";
import { PlotAssetDataObjectType, WorldDataObjectType } from "../types/index.js";

export const getPlotAssets = async (
  credentials: Credentials,
  shouldFetchAllPlotAssets: boolean = true,
): Promise<{ availablePlotAssetIds: string[]; claimedPlotAssetIds: string[] } | Error> => {
  try {
    const { urlSlug } = credentials;

    const world = await World.create(urlSlug, { credentials });
    const worldDataObject = (await world.fetchDataObject()) as WorldDataObjectType;

    let plots = worldDataObject?.plots || worldDataObject?.claimedPlots || {};

    if (shouldFetchAllPlotAssets || Object.keys(plots).length === 0) {
      const plotAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "GrowTogether_plot",
      });

      if (plotAssets.length === 0) throw "No plot assets found.";

      // Limit concurrency for DroppedAsset.create/fetchDataObject
      const CONCURRENCY_LIMIT = 20;
      const results: { assetId: string; ownerId: string | null }[] = [];
      let index = 0;
      while (index < plotAssets.length) {
        const batch = plotAssets.slice(index, index + CONCURRENCY_LIMIT);
        const batchPromises = batch.map(async (asset) => {
          try {
            const plotAsset = await DroppedAsset.create(asset.id!, urlSlug, {
              credentials: { ...credentials, assetId: asset.id! },
            });
            await plotAsset.fetchDataObject();
            const plotAssetData = plotAsset.dataObject as PlotAssetDataObjectType;

            // Return the asset id and owner id (or null if not owned)
            return { assetId: asset.id!, ownerId: plotAssetData?.ownerId || null };
          } catch {
            return null;
          }
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...(batchResults.filter(Boolean) as { assetId: string; ownerId: string | null }[]));
        index += CONCURRENCY_LIMIT;
      }
      plots = results.reduce<{ [key: string]: string | null }>((acc, result) => {
        acc[result.assetId] = result.ownerId;
        return acc;
      }, {});

      world.setDataObject(
        {
          plots,
        },
        {
          lock: { lockId: `world_plotAssets_${Math.floor(Date.now() / 60000) * 60000}`, releaseLock: true },
        },
      );
    }

    if (Object.keys(plots).length === 0) throw "No plot assets found.";

    // Separate available and claimed plot asset ids
    const availablePlotAssetIds = Object.entries(plots)
      .filter(([_, ownerId]) => ownerId === null)
      .map(([plotId, _]) => plotId);

    const claimedPlotAssetIds = Object.entries(plots)
      .filter(([_, ownerId]) => ownerId !== null)
      .map(([plotId, _]) => plotId);

    return { availablePlotAssetIds, claimedPlotAssetIds };
  } catch (error: any) {
    return standardizeError(error);
  }
};
