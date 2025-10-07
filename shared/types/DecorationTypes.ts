/**
 * Shared decoration types between client and server
 */

export type DecorationType = {
  id: number;
  name: string;
  cost: number;
  icon: string;
  imageSrc: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  description: string;
};

export type PlacedDecorationDataObjectType = {
  decorationId: number;
  ownerId?: string;
  ownerName?: string;
  dateDropped: string;
  squareId: number; // Which square in the plot
};
