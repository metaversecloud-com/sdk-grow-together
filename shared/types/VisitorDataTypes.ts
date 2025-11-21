/**
 * Shared types between client and server for visitor data
 */

import { CropDataObjectType, PlacedDecorationDataObjectType } from "./index.js";

export type VisitorWorldDataType = {
  plotAssetId: string | null;
  plotSignAssetId: string | null;
  claimedDate: string;
  lastInteractionDate: string;
  plotSquares: {
    [squareId: number]: string | null; // droppedAssetId of crop or null if empty
  };
  crops: {
    [droppedAssetId: string]: CropDataObjectType;
  };
  decorations: {
    [droppedAssetId: string]: PlacedDecorationDataObjectType;
  };
};

export type VisitorInventoryType = {
  [itemId: string]: {
    id: string;
    quantity: number;
    availableQuantity: number;
  };
};

export type VisitorDataObjectType = {
  lastDateCoinsEarned: string; // ISO date string when the plot was claimed
  totalCoinsEarned: number; // Lifetime coins earned (for unlocks)
  placedDecorations: {
    [decorationId: string]: {
      [urlSlug: string]: string[]; // array of droppedAssetIds
    };
  };
  worlds: {
    [urlSlug: string]: VisitorWorldDataType;
  };
};
