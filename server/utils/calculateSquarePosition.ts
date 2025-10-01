import { plotConfig } from "../../shared/index.js";

/**
 * Calculate position for a plot square based on square index
 */
export const calculateSquarePosition = (plotPosition: { x: number; y: number }, squareIndex: number) => {
  const { gridCols, gridRows, squareSpacing } = plotConfig;

  const row = Math.floor(squareIndex / gridCols);
  const col = squareIndex % gridCols;

  // Center the grid using gridCols and gridRows
  const offsetX = (col - (gridCols - 1) / 2) * squareSpacing;
  const offsetY = (row - (gridRows - 1) / 2) * squareSpacing;

  return {
    x: plotPosition.x + offsetX,
    y: plotPosition.y + offsetY,
  };
};
