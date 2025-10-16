/**
 * Shared types between client and server for plot dropped asset data
 */

export type PlotAssetDataObjectType = {
  ownerId?: string; // profileId of the owner
  ownerName?: string; // displayName of the owner
  claimedDate?: string; // ISO date string when the plot was claimed
};
