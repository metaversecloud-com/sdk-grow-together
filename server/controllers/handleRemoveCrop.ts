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

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];
    const assetId = visitorPlotData.plotSquares[squareId];

    if (!assetId) throw "No crop found on the specified square";

    visitorData.worlds[urlSlug].plotSquares[squareId] = null;
    delete visitorData.worlds[urlSlug].crops[assetId];

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "cropRemoved",
          profileId,
          urlSlug,
          uniqueKey: profileId,
        },
      ],
    });

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    const world = World.create(urlSlug, { credentials });
    await world
      .triggerParticle({
        name: "dirt_grow_together",
        duration: 1,
        position: droppedAsset.position,
      })
      .catch((error) => {
        console.error(`Failed to trigger particle effect:`, error);
      });

    await droppedAsset.deleteDroppedAsset();

    return res.json({
      success: true,
      visitorData,
      visitorPlotData: visitorData.worlds[urlSlug],
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
