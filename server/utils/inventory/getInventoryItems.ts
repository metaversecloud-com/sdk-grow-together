import { Credentials } from "../../types/index.js";
import { standardizeError } from "../standardizeError.js";
import { inventoryCache } from "../cache/inventoryCache.js";

/**
 * Get all inventory items (decorations, seeds, tools) with caching
 * Results are cached for daily and automatically refreshed in the background
 */
export const getInventoryItems = async (credentials: Credentials) => {
  try {
    return await inventoryCache.get(credentials);
  } catch (error: any) {
    return standardizeError(error);
  }
};
