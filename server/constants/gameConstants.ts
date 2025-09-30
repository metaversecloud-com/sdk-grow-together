import { PlantDataObjectType, VisitorDataType } from "../../shared/types/index.js";
import { PlotGridConfigType } from "../types/index.js";

export const PLOT_GRID_CONFIG: PlotGridConfigType = {
  gridSize: 4,
  squareSpacing: 100,
  plotDimensions: {
    width: 400,
    height: 400,
  },
};

export const DEFAULT_VISITOR_DATA: VisitorDataType = {
  coinsAvailable: 0, // Starting coins
  totalCoinsEarned: 0,
  ownedPlot: null, // No plot claimed initially
  seedsPurchased: {},
  plants: {},
};

export const DEFAULT_PLANT_DATA: PlantDataObjectType = {
  ownerId: "",
  ownerName: "",
  dateDropped: "",
  lastWatered: "",
  seedId: 0,
  growLevel: 0,
  squareIndex: 0,
  wasHarvested: false,
};
