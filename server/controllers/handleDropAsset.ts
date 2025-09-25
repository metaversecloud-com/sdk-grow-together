import { Request, Response } from "express";
import { Asset, DroppedAsset, errorHandler, getCredentials, World } from "../utils/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const handleDropAsset = async (req: Request, res: Response): Promise<Record<string, any> | void> => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, interactivePublicKey, profileId, sceneDropId, urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });
    const droppedAsset: DroppedAssetInterface = await DroppedAsset.get(assetId, urlSlug, { credentials });
    const asset = Asset.create(droppedAsset.assetId!, { credentials });

    const xOffset = Math.floor(Math.random() * 200);
    const yOffset = Math.floor(Math.random() * 200);
    const x = droppedAsset.position.x + xOffset;
    const y = droppedAsset.position.y + yOffset;

    await DroppedAsset.drop(asset, {
      isInteractive: true,
      interactivePublicKey,
      position: { x, y },
      uniqueName: `${sceneDropId}-clone`,
      urlSlug,
    });

    droppedAsset.incrementDataObjectValue("droppedAssetCount", 1, {
      analytics: [{ analyticName: "drops", uniqueKey: profileId }],
    });

    world.triggerParticle({
      name: "whiteStar_burst",
      duration: 3,
      position: {
        x: droppedAsset?.position?.x,
        y: droppedAsset?.position?.y,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleDropAsset",
      message: "Error dropping asset",
      req,
      res,
    });
  }
};
