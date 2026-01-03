import { InventoryItemInterface, UserInventoryItemInterface } from "@rtsdk/topia";

export type WorldDataObjectType = {
  claimedPlots?: object;
  plots: {
    [plotAssetId: string]: string | null; // profileId of owner
  };
};

export interface EcosystemItemType extends InventoryItemInterface {
  credentials: any;
  fetchInventoryItemById: any;
  topiaPublicApi: any;
  errorHandler: any;
  quantity?: number;
  metadata: {
    type?: string;
    cost?: number;
    rarity?: number;
    reward?: number;
    growthTime?: number;
    harvestLevel?: number;
    canBeUsedOnPlot?: boolean;
    actionType?: string;
    sortOrder?: number;
  };
}

export interface UserItems extends UserInventoryItemInterface {
  image_url?: string;
}
