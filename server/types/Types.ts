import { InventoryItemInterface } from "@rtsdk/topia";

export type WorldDataObjectType = {
  claimedPlots: {
    [plotAssetId: string]: string | null; // profileId of owner
  };
};

export interface EcosystemItems extends InventoryItemInterface {
  quantity?: number;
  metadata: {
    type?: string;
    cost?: number;
    rarity?: string;
    reward?: number;
    growthTime?: number;
    harvestLevel?: number;
  };
}
