/**
 * Shared decoration types between client and server
 */

import { rarityLevels } from "../index.js";

export type DecorationType = {
  id: number;
  name: string;
  cost: number;
  icon: string;
  imageSrc: string;
  rarity: (typeof rarityLevels)[number];
  description: string;
};

export type PlacedDecorationDataObjectType = {
  decorationId: number;
  ownerId?: string;
  ownerName?: string;
  dateDropped: string;
  squareId: number; // Which square in the plot
};
