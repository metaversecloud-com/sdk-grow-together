import { Request, Response } from "express";
import { errorHandler, getCredentials, DroppedAsset, initializeVisitorData } from "../utils/index.js";
import { PlantDataObjectType } from "../../shared/types/PlantData.js";

/**
 * Get the plant info for a specific plant asset
 */
export const handleGetPlantInfo = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug } = credentials;

    const initializeVisitorDataResponse = await initializeVisitorData(credentials);
    if (initializeVisitorDataResponse instanceof Error) throw initializeVisitorDataResponse;

    const { visitorData } = initializeVisitorDataResponse;

    const droppedAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
    const plantData = (await droppedAsset.fetchDataObject()) as PlantDataObjectType;

    return res.json({
      success: true,
      plantData,
      visitorPlotData: visitorData.worlds[urlSlug],
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetGameState",
      message: "Error getting game state",
      req,
      res,
    });
  }
};
