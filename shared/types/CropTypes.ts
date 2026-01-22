/**
 * Shared types between client and server for crop dropped asset data
 */

export type CropDataObjectType = {
  plotAssetId?: string;
  ownerId?: string;
  ownerName?: string;
  squareId: number; // Which square in the plot
  seedId: string;
  name: string;
  dateDropped: string;
  lastWatered: string;
  growLevel: number;
  appliedTools: string[];
};
