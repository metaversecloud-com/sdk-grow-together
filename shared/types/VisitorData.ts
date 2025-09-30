/**
 * Shared types between client and server for visitor data
 */

import { PlantDataObjectType } from "./PlantData.js";

export type VisitorDataType = {
  coinsAvailable: number; // Current spendable coins
  totalCoinsEarned: number; // Lifetime coins earned (for unlocks)
  ownedPlot: {
    plotAssetId: string;
    claimedDate: string;
    plotSquares: {
      [squareIndex: number]: string | null; // droppedAssetId of plant or null if empty (0-15)
    };
  } | null; // null if no plot claimed yet
  seedsPurchased: {
    [seedId: number]: {
      id: number;
      datePurchased: string;
    };
  };
  plants: {
    [droppedAssetId: string]: PlantDataObjectType;
  };
};

export type VisitorDataObjectType = {
  [urlSlug: string]: VisitorDataType;
};
