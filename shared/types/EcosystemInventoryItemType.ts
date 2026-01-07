/**
 * Shared Ecosystem Inventory Item types between client and server
 */
export type EcosystemInventoryItemType = {
  id: string;
  name: string;
  cost: number; // 0 for free seeds
  reward: number; // coins earned when harvested
  growthTime: number; // total time in seconds per level
  harvestLevel: number; // level when crop is ready for harvest
  rarity: string; // rarity of the seed
  icon: string;
  quantity: number;
  description: string;
  canBeUsedOnPlot: boolean;
  actionType: string | undefined;
  sortOrder?: number;
};
