/**
 * Shared types between client and server for plant dropped asset data
 */

export type PlantDataObjectType = {
  ownerId?: string;
  ownerName?: string;
  dateDropped: string;
  lastWatered: string;
  seedId: number;
  growLevel: number;
  squareIndex: number; // Which square in the plot (0-15)
  wasHarvested: boolean;
};
