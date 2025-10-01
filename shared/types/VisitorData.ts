/**
 * Shared types between client and server for visitor data
 */

import { PlacedDecorationType, PlantDataObjectType } from "./index.js";

export type VisitorWorldDataType = {
  plotAssetId: string | null;
  claimedDate: string;
  plotSquares: {
    [squareIndex: number]: string | null; // droppedAssetId of plant or null if empty
  };
  plants: {
    [droppedAssetId: string]: PlantDataObjectType;
  };
  decorations: {
    [droppedAssetId: string]: PlacedDecorationType;
  };
};

export type VisitorDataObjectType = {
  coinsAvailable: number; // Current spendable coins
  lastDateCoinsEarned: string; // ISO date string when the plot was claimed
  totalCoinsEarned: number; // Lifetime coins earned (for unlocks)
  decorationsOwned: {
    [decorationId: number]: {
      id: number;
      dateReceived: string;
      available: number;
    };
  };
  seedsPurchased: {
    [seedId: number]: {
      id: number;
      datePurchased: string;
    };
  };
  worlds: {
    [urlSlug: string]: VisitorWorldDataType;
  };
};
