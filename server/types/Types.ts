import { InventoryItemInterface } from "@rtsdk/topia";

export type WorldDataObjectType = {
  claimedPlots?: object;
  plots: {
    [plotAssetId: string]: string | null; // profileId of owner
  };
};

export interface EcosystemItems extends InventoryItemInterface {
  quantity?: number;
  metadata: {
    type?: string;
    cost?: number;
    rarity?: number;
    reward?: number;
    growthTime?: number;
    harvestLevel?: number;
    sortOrder?: number;
  };
}
