export type WorldDataObjectType = {
  claimedPlots?: object;
  plots: {
    [plotAssetId: string]: string | null; // profileId of owner
  };
};

export type MetadataType = {
  displayName?: string;
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
