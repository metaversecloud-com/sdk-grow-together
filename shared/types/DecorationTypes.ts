/**
 * Shared decoration types between client and server
 */
export type PlacedDecorationDataObjectType = {
  plotAssetId?: string;
  decorationId: string;
  decorationName: string;
  ownerId?: string;
  ownerName?: string;
  dateDropped: string;
  squareId: number; // Which square in the plot
};
