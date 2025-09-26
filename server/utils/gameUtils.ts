import { PLOT_GRID_CONFIG } from "../constants/gameConstants.js";

/**
 * Calculate growth level based on time elapsed, seed growth time, and harvest level
 */
export const calculateGrowthLevel = (dateDropped: string, growthTime: number, harvestLevel: number): number => {
  const currentTime = new Date().getTime();
  const plantedTime = new Date(dateDropped).getTime();
  const timeElapsed = (currentTime - plantedTime) / 1000; // Convert to seconds

  const growthLevel = Math.floor(timeElapsed / (growthTime / harvestLevel));
  return Math.min(growthLevel, harvestLevel); // Cap at harvest level
};

/**
 * Calculate position for a plot square based on square index (0-15)
 */
export const calculateSquarePosition = (plotPosition: { x: number; y: number }, squareIndex: number) => {
  const { gridSize, squareSpacing } = PLOT_GRID_CONFIG;

  const row = Math.floor(squareIndex / gridSize);
  const col = squareIndex % gridSize;

  // Calculate offset from plot center
  const offsetX = (col - (gridSize - 1) / 2) * squareSpacing;
  const offsetY = (row - (gridSize - 1) / 2) * squareSpacing;

  return {
    x: plotPosition.x + offsetX,
    y: plotPosition.y + offsetY,
  };
};
