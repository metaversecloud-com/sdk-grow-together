export type WorldDataObjectType = {
  claimedPlots: {
    [plotAssetId: string]: string | null; // profileId of owner
  };
};
