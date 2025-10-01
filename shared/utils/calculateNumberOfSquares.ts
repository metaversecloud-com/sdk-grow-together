import { plotConfig } from "../index.js";

/**
 * Calculate number of squares for a plot based on configuration
 */
export const calculateNumberOfSquares = (shouldAdjust: boolean) => {
  const { gridCols, gridRows } = plotConfig;
  const noOfSquares = gridCols * gridRows;
  if (shouldAdjust) return noOfSquares - 1; // Adjust for 0 index
  return noOfSquares - 1;
};
