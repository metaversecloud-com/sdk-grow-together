import { InventoryItemInterface, UserInventoryItemInterface } from "@rtsdk/topia";

export type WorldDataObjectType = {
  claimedPlots?: object;
  plots: {
    [plotAssetId: string]: string | null; // profileId of owner
  };
};

export type MetadataType = {
  type?: string;
  cost?: number;
  rarity?: number;
  reward?: number;
  xp?: number;
  growthTime?: number;
  harvestLevel?: number;
  canBeUsedOnPlot?: boolean;
  actionType?: string;
  sortOrder?: number;
  quantity?: number;
};

export interface IEcosystemItems extends InventoryItemInterface {
  credentials: any;
  fetchInventoryItemById: any;
  topiaPublicApi: any;
  errorHandler: any;
  metadata?: MetadataType;
}
