/**
 * Shared decoration types between client and server
 */

import { rarityLevels } from "../index.js";

export type DecorationType = {
  id: string;
  name: string;
  cost: number;
  imageSrc: string;
  rarity: (typeof rarityLevels)[number];
  description: string;
};

export type PlacedDecorationDataObjectType = {
  decorationId: string;
  ownerId?: string;
  ownerName?: string;
  dateDropped: string;
  squareId: number; // Which square in the plot
};
