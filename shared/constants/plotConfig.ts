/**
 * Shared plot config between client and server
 */

export const s3URL = "https://topia-dev-test.s3.us-east-1.amazonaws.com/bounty";

export const plotConfig = {
  gridCols: 4,
  gridRows: 4,
  reservedSquares: [12, 13, 14, 15], // reserved for decorations
  squareSpacing: 100,
  plotDimensions: {
    width: 400,
    height: 400,
  },
};
