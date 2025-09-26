/**
 * Shared types between client and server for visitor data
 */

export interface VisitorData {
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
    [droppedAssetId: string]: {
      dateDropped: string;
      seedId: number;
      growLevel: number;
      squareIndex: number; // Which square in the plot (0-15)
      wasHarvested: boolean;
    };
  };
}

export interface VisitorDataObject {
  [urlSlug: string]: VisitorData;
}
