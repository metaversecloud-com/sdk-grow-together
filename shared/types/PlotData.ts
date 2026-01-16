/**
 * Shared types between client and server for plot dropped asset data
 */

export type PlotAssetDataObjectType = {
  plotAssetId: string;
  ownerId?: string; // profileId of the owner
  ownerName?: string; // displayName of the owner
  claimedDate?: string; // ISO date string when the plot was claimed
  lastInteractionDate?: string; // ISO date string when the owner last viewed the plot
};
