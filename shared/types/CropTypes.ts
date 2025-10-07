/**
 * Shared types between client and server for crop dropped asset data
 */

export type CropDataObjectType = {
  ownerId?: string;
  ownerName?: string;
  dateDropped: string;
  lastWatered: string;
  seedId: number;
  growLevel: number;
  squareId: number; // Which square in the plot
};
