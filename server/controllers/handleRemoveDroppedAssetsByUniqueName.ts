import { Request, Response } from "express";
import { errorHandler, getCredentials, World } from "../utils/index.js";

export const handleRemoveDroppedAssetsByUniqueName = async (
  req: Request,
  res: Response,
): Promise<Record<string, any> | void> => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });

    const droppedAssets = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: `${sceneDropId}-clone`,
    });

    if (Object.keys(droppedAssets).length > 0) {
      const droppedAssetIds: string[] = [];
      for (const index in droppedAssets) {
        if (droppedAssets[index].id) droppedAssetIds.push(droppedAssets[index].id);
      }
      await World.deleteDroppedAssets(
        credentials.urlSlug,
        droppedAssetIds,
        process.env.INTERACTIVE_SECRET!,
        credentials,
      );
    }

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleRemoveDroppedAssets",
      message: "Error removing dropping assets",
      req,
      res,
    });
  }
};
