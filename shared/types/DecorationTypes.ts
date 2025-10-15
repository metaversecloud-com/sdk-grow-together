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
};

export type PlacedDecorationDataObjectType = {
  decorationId: string;
  ownerId?: string;
  ownerName?: string;
  dateDropped: string;
  squareId: number; // Which square in the plot
};
