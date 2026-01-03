/**
 * Shared decoration types between client and server
 */
export type DecorationType = {
  id: string;
  name: string;
  cost: number;
  icon: string;
  rarity: string;
  description: string;
  sortOrder?: number;
};

export type PlacedDecorationDataObjectType = {
  plotAssetId?: string;
  decorationId: string;
  decorationName: string;
  ownerId?: string;
  ownerName?: string;
  dateDropped: string;
  squareId: number; // Which square in the plot
};
