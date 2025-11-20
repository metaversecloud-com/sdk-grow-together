import { DroppedAssetInterface } from "@rtsdk/topia";
import { DroppedAsset, World, standardizedError } from "./index.js";
import { Credentials } from "../types/Credentials.js";
import { PlotAssetDataObjectType, WorldDataObjectType } from "../types/index.js";

export const getPlotAssets = async (
  credentials: Credentials,
): Promise<{ availablePlotAssetIds: string[]; claimedPlotAssetIds: string[] } | Error> => {
  try {
    const { urlSlug } = credentials;

    const world = await World.create(urlSlug, { credentials });
    const worldDataObject = (await world.fetchDataObject()) as WorldDataObjectType;

    let plots = worldDataObject?.plots || worldDataObject?.claimedPlots || {};

    const plotAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: "GrowTogether_plot",
    });

    if (plotAssets.length === 0) throw "No plot assets found.";

    if (plotAssets.length !== Object.keys(plots).length) {
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

      // Build the plots object from the results
      plots = plotDataResults.reduce<{ [key: string]: string | null }>((acc, result) => {
        acc[result.assetId] = result.ownerId;
        return acc;
      }, {});
    }

    world.setDataObject(
      {
        plots,
      },
      {
        lock: { lockId: `world_plotAssets_${Math.floor(Date.now() / 60000) * 60000}`, releaseLock: true },
      },
    );

    const availablePlotAssetIds = Object.entries(plots)
      .filter(([_, ownerId]) => ownerId === null)
      .map(([plotId, _]) => plotId);

    const claimedPlotAssetIds = Object.entries(plots)
      .filter(([_, ownerId]) => ownerId !== null)
      .map(([plotId, _]) => plotId);

    return { availablePlotAssetIds, claimedPlotAssetIds };
  } catch (error: any) {
    return standardizedError(error);
  }
};
