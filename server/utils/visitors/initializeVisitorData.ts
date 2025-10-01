import { Visitor } from "../index.js";
import { Credentials } from "../../types/Credentials.js";
import { VisitorDataObjectType } from "../../types/index.js";
import { DEFAULT_VISITOR_DATA, DEFAULT_VISITOR_WORLD_DATA } from "../../constants.js";

/**
 * Initialize visitor data object with default values if it doesn't exist or is missing properties
 */
export const initializeVisitorData = async (credentials: Credentials): Promise<VisitorDataObjectType | Error> => {
  const { urlSlug, visitorId } = credentials;

  try {
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    let visitorData = (await visitor.fetchDataObject()) as VisitorDataObjectType;

    if (visitorData?.worlds?.[urlSlug]) return visitorData;

    const lockId = `visitor_data_init_${Math.floor(Date.now() / 60000) * 60000}`;

    if (!visitorData || typeof visitorData.totalCoinsEarned === "undefined") {
      // Set the initialized data object
      await visitor.setDataObject(
        { ...DEFAULT_VISITOR_DATA, worlds: { [urlSlug]: DEFAULT_VISITOR_WORLD_DATA } },
        {
          lock: { lockId, releaseLock: true },
        },
      );
    } else if (!visitorData.worlds[urlSlug]) {
      // Update the initialized data object
      await visitor.updateDataObject(
        { [`worlds.${urlSlug}`]: DEFAULT_VISITOR_WORLD_DATA },
        {
          lock: { lockId, releaseLock: true },
        },
      );
    }

    visitorData = (await visitor.fetchDataObject()) as VisitorDataObjectType;
    return visitorData;
  } catch (error: any) {
    throw new Error(`Failed to initialize visitor data: ${error.message}`);
  }
};
