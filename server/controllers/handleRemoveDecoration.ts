import { Request, Response } from "express";
import { errorHandler, getCredentials, initializeVisitorData, DroppedAsset, World } from "../utils/index.js";

/**
 * Handle decoration removal - removes decoration from world and frees up the plot square
 */
export const handleRemoveDecoration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const { squareIndex } = req.body;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitor, visitorData } = initializeVisitorDataResponse;

    const visitorPlotData = visitorData.worlds[urlSlug];
    const assetId = visitorPlotData.plotSquares[squareIndex];

    if (!assetId) throw "No decoration found on the specified square";

    const decoration = visitorPlotData.decorations[assetId];

    visitorData.decorationsOwned[decoration.id].quantity += 1;
    visitorData.worlds[urlSlug].plotSquares[squareIndex] = null;
    delete visitorData.worlds[urlSlug].decorations[assetId];

    await visitor.updateDataObject(visitorData, {
      analytics: [
        {
          analyticName: "decorationRemoved",
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
        name: "lightBlueSmoke_puff",
        duration: 2,
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
      functionName: "handleRemoveDecoration",
      message: "Error removing decoration",
      req,
      res,
    });
  }
};
