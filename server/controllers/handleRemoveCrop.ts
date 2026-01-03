import { Request, Response } from "express";
import { errorHandler, getCredentials, initializeVisitorData, DroppedAsset, World } from "../utils/index.js";

/**
 * Handle crop removal - removes crop from world and frees up the plot square
 */
export const handleRemoveCrop = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { squareId } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData, visitorInventory } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];
    const assetId = visitorPlotData.plotSquares[squareId];

    if (!assetId) throw "No crop found on the specified square";

    // Check if visitor owns this plot
    if (visitorPlotData.plotAssetId !== assetId) throw "You must own this plot before remvoving crops";

    visitorData.worlds[urlSlug].plotSquares[squareId] = null;
    delete visitorData.worlds[urlSlug].crops[assetId];

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "cropsRemoved",
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
      ],
    });

    try {
      const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

      const world = World.create(urlSlug, { credentials });
      await world
        .triggerParticle({
          name: "dirt_grow_together",
          duration: 1,
          position: droppedAsset.position,
        })
        .catch((error) => {
          errorHandler({
            error,
            functionName: "handleRemoveCrop",
            message: `Failed to trigger remove particle effect: ${error}`,
          });
        });

      await droppedAsset.deleteDroppedAsset();
    } catch (error) {
      // Continue with removal even if asset deletion fails (it might have been manually removed from world)
      errorHandler({
        error,
        functionName: "handleRemoveCrop",
        message: `Crop asset with id '${assetId}' has already been removed from world.`,
      });
    }

    return res.json({
      success: true,
      visitorData,
      visitorPlotData: visitorData.worlds[urlSlug],
      visitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleRemoveCrop",
      message: "Error removing crop",
      req,
      res,
    });
  }
};
