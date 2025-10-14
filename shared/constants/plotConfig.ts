/**
 * Shared plot config between client and server
 */

export const s3URL = "https://sdk-grow-together.s3.us-east-1.amazonaws.com";

export const rarityLevels = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export const plotConfig = {
  gridCols: 4,
  gridRows: 4,
  reservedSquares: [1, 2, 3, 4], // reserved for decorations
  squareSpacing: 100,
  plotDimensions: {
    width: 400,
    height: 400,
  },
};
