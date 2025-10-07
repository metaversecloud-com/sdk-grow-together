import { plotConfig } from "../index.js";

/**
 * Calculate number of squares for a plot based on configuration
 */
export const calculateNumberOfSquares = () => {
  const { gridCols, gridRows } = plotConfig;
  const noOfSquares = gridCols * gridRows;
  return noOfSquares;
};
