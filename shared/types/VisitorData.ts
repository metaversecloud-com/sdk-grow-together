/**
 * Shared types between client and server for visitor data
 */

import { DecorationType, PlantDataObjectType } from "./index.js";

export type VisitorWorldDataType = {
  ownedPlot: {
    plotAssetId: string;
    claimedDate: string;
    plotSquares: {
      [squareIndex: number]: string | null; // droppedAssetId of plant or null if empty
    };
  } | null; // null if no plot claimed yet
  plants: {
    [droppedAssetId: string]: PlantDataObjectType;
  };
  decorations: {
    [droppedAssetId: string]: DecorationType;
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
      numberAvailable: number;
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
