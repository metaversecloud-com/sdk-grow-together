import { VisitorData } from "../../shared/types/VisitorData.js";
import { PlotGridConfig } from "../types/Interfaces.js";

export const PLOT_GRID_CONFIG: PlotGridConfig = {
  gridSize: 4,
  squareSpacing: 100,
  plotDimensions: {
    width: 400,
    height: 400,
  },
};

export const DEFAULT_VISITOR_DATA: VisitorData = {
  coinsAvailable: 0, // Starting coins
  totalCoinsEarned: 0,
  ownedPlot: null, // No plot claimed initially
  seedsPurchased: {},
  plants: {},
};
