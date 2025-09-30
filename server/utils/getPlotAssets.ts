import { DroppedAssetInterface } from "@rtsdk/topia";
import { World } from "./index.js";
import { Credentials } from "../types/Credentials.js";
import { WorldDataObjectType } from "../types/index.js";

export const getPlotAssets = async (credentials: Credentials): Promise<WorldDataObjectType | Error> => {
  try {
    const { urlSlug } = credentials;

    const world = await World.create(urlSlug, { credentials });
    const worldDataObject = (await world.fetchDataObject()) as WorldDataObjectType;

    let claimedPlots = worldDataObject?.claimedPlots || {};

    if (!worldDataObject?.claimedPlots || Object.keys(worldDataObject?.claimedPlots).length === 0) {
      const plotAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsWithUniqueName({
        uniqueName: "BountyBuilders_plot",
      });

      if (plotAssets.length === 0) throw "No plot assets found.";

      claimedPlots = plotAssets.reduce<{ [key: string]: string | null }>((acc, asset) => {
        acc[asset.id!] = null;
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
    return new Error(error);
  }
};
