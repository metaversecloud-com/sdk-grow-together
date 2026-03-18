import { Credentials, InventoryItemType } from "../../types/index.js";
import { InventoryItemInterface } from "@rtsdk/topia";
import { Ecosystem, standardizeError, structureEcosystemInventoryItem } from "../index.js";

// Cache duration: 6 hours in milliseconds
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

interface InventoryCacheEntry {
  data: {
    allItems: InventoryItemInterface[];
    ecosystemAccessories: { [key: string]: InventoryItemType };
    ecosystemDecorations: { [key: string]: InventoryItemType };
    ecosystemSeeds: { [key: string]: InventoryItemType };
    ecosystemTools: { [key: string]: InventoryItemType };
  };
  timestamp: number;
  isRefreshing: boolean;
}

class InventoryCache {
  private cache: Map<string, InventoryCacheEntry> = new Map();
  private readonly TTL_MS: number;
  private readonly REFRESH_THRESHOLD_MS: number;

  constructor() {
    this.TTL_MS = CACHE_DURATION_MS;
    // Start refreshing when 80% of TTL has elapsed
    this.REFRESH_THRESHOLD_MS = this.TTL_MS * 0.8;
  }

  /**
   * Get cache key for the inventory items
   */
  private getCacheKey(credentials: Credentials): string {
    return credentials.interactivePublicKey;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: InventoryCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.TTL_MS;
  }

  /**
   * Check if cache entry should be refreshed
   */
  private shouldRefresh(entry: InventoryCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.REFRESH_THRESHOLD_MS;
  }

  /**
   * Fetch fresh inventory data from SDK
   */
  private async fetchInventoryData(credentials: Credentials) {
    const ecosystem = await Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    const allItems = ecosystem.inventoryItems;

    let ecosystemAccessories: { [key: string]: InventoryItemType } = {};
    let ecosystemDecorations: { [key: string]: InventoryItemType } = {};
    let ecosystemSeeds: { [key: string]: InventoryItemType } = {};
    let ecosystemTools: { [key: string]: InventoryItemType } = {};

    for (const item of allItems) {
      if (item.status !== "ACTIVE") continue;

      const data = await structureEcosystemInventoryItem(item);

      if (item.type === "ACCESSORY") ecosystemAccessories[data.id] = data;
      else if (data.type === "decoration") ecosystemDecorations[data.id] = data;
      else if (data.type === "seed") ecosystemSeeds[data.id] = data;
      else if (data.type === "tool") ecosystemTools[data.id] = data;
    }

    // Sort items by sortOrder while keeping them as objects
    const sortedAccessories: { [key: string]: InventoryItemType } = {};
    const sortedDecorations: { [key: string]: InventoryItemType } = {};
    const sortedSeeds: { [key: string]: InventoryItemType } = {};
    const sortedTools: { [key: string]: InventoryItemType } = {};

    // Sort accessories
    Object.values(ecosystemAccessories)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((accessory) => {
        sortedAccessories[accessory.id] = accessory;
      });

    // Sort decorations
    Object.values(ecosystemDecorations)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((decoration) => {
        sortedDecorations[decoration.id] = decoration;
      });

    // Sort seeds
    Object.values(ecosystemSeeds)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((seed) => {
        sortedSeeds[seed.id] = seed;
      });

    // Sort tools
    Object.values(ecosystemTools)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((tool) => {
        sortedTools[tool.id] = tool;
      });

    return {
      allItems,
      ecosystemAccessories: sortedAccessories,
      ecosystemDecorations: sortedDecorations,
      ecosystemSeeds: sortedSeeds,
      ecosystemTools: sortedTools,
    };
  }

  /**
   * Refresh cache entry in background
   */
  private async refreshInBackground(cacheKey: string, credentials: Credentials): Promise<void> {
    const entry = this.cache.get(cacheKey);
    if (!entry || entry.isRefreshing) return;

    // Mark as refreshing to prevent duplicate refreshes
    entry.isRefreshing = true;

    try {
      const freshData = await this.fetchInventoryData(credentials);
      this.cache.set(cacheKey, {
        data: freshData,
        timestamp: Date.now(),
        isRefreshing: false,
      });
      console.log(`[InventoryCache] Refreshed cache for key: ${cacheKey}`);
    } catch (error) {
      console.error(`[InventoryCache] Background refresh failed for key: ${cacheKey}`, error);
      // Keep the old data and mark as not refreshing so we can try again
      entry.isRefreshing = false;
    }
  }

  /**
   * Get inventory items from cache or fetch if not cached
   */
  async get(credentials: Credentials, forceRefresh = false) {
    const cacheKey = this.getCacheKey(credentials);
    const cachedEntry = this.cache.get(cacheKey);

    // Return cached data if valid and not forcing refresh
    if (cachedEntry && !this.isExpired(cachedEntry) && !forceRefresh) {
      // Trigger background refresh if approaching expiry
      if (this.shouldRefresh(cachedEntry) && !cachedEntry.isRefreshing) {
        this.refreshInBackground(cacheKey, credentials).catch((error) => {
          console.error(`[InventoryCache] Failed to trigger background refresh:`, error);
        });
      }

      return cachedEntry.data;
    }

    // Cache miss or expired - fetch fresh data
    console.log(`[InventoryCache] Cache miss for key: ${cacheKey}, fetching fresh data...`);

    try {
      const freshData = await this.fetchInventoryData(credentials);

      // Store in cache
      this.cache.set(cacheKey, {
        data: freshData,
        timestamp: Date.now(),
        isRefreshing: false,
      });

      return freshData;
    } catch (error: any) {
      // If we have stale data, return it as fallback
      if (cachedEntry) {
        console.warn(`[InventoryCache] Fetch failed, returning stale cache for key: ${cacheKey}`, error);
        return cachedEntry.data;
      }
      throw standardizeError(error);
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    console.log("[InventoryCache] Cache cleared");
  }

  /**
   * Remove specific cache entry
   */
  invalidate(credentials: Credentials): void {
    const cacheKey = this.getCacheKey(credentials);
    this.cache.delete(cacheKey);
    console.log(`[InventoryCache] Invalidated cache for key: ${cacheKey}`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      isRefreshing: entry.isRefreshing,
      isExpired: this.isExpired(entry),
      shouldRefresh: this.shouldRefresh(entry),
    }));

    return {
      size: this.cache.size,
      ttlMs: this.TTL_MS,
      entries,
    };
  }
}

// Export singleton instance
export const inventoryCache = new InventoryCache();
