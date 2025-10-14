import { Visitor } from "./topiaInit.js";
import { Credentials } from "../types/Credentials.js";
import { EcosystemItems, VisitorDataObjectType } from "../types/index.js";
import { DEFAULT_VISITOR_DATA, DEFAULT_VISITOR_WORLD_DATA } from "../constants.js";
import { VisitorInventoryType } from "../../shared/types/VisitorDataTypes";

/**
 * Initialize visitor data object with default values if it doesn't exist or is missing properties
 */
export const initializeVisitorData = async (credentials: Credentials) => {
  try {
    const { urlSlug, visitorId } = credentials;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    let visitorData = (await visitor.fetchDataObject()) as VisitorDataObjectType;

    if (!visitorData?.worlds?.[urlSlug]) {
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
    }

    // visitor items don't returning metadata
    // await visitor.fetchInventoryItems();
    // const allItems = visitor.inventoryItems as EcosystemItems[];
    // console.log("🚀 ~ initializeVisitorData.ts:43 ~ allItems:", allItems)
    // let visitorInventory: VisitorInventoryType = {
    //   coinsAvailable: 0,
    //   decorationsOwned: {},
    //   seedsPurchased: {},
    // };
    // // const coinsInventoryItem = visitor.inventoryItems?.find((item) => item.name === "Coins");
    // for (const item of allItems || []) {
    //   if (item.name === "Coins") {
    //     visitorInventory.coinsAvailable = item.quantity || 0;
    //   } else if (item.metadata.type === "seed") {
    //     visitorInventory.seedsPurchased[item.id] = {
    //       id: item.id,
    //       quantity: item.quantity || 0,
    //     };
    //   } else if (item.metadata.type === "decoration") {
    //     visitorInventory.decorationsOwned[item.id] = {
    //       id: item.id,
    //       quantity: item.quantity || 0,
    //     };
    //   }
    // }

    await visitor.fetchInventoryItems();
    const allItems = visitor.inventoryItems as EcosystemItems[];
    let visitorInventory = {} as { [key: string]: { id: string; quantity: number } };
    for (const item of allItems || []) {
      visitorInventory[item.name!] = {
        id: item.name!,
        quantity: item.quantity || 0,
      };
    }

    return { visitor, visitorData, visitorInventory };
  } catch (error: any) {
    throw new Error(`Failed to initialize visitor data: ${error.message}`);
  }
};
