/**
 * Shared types between client and server for crop dropped asset data
 */

export type CropDataObjectType = {
  ownerId?: string;
  ownerName?: string;
  squareId: number; // Which square in the plot
  dateDropped: string;
  lastWatered: string;
  seedId: string;
  growLevel: number;
};
