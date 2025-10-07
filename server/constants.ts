import { CropDataObjectType, VisitorDataObjectType, VisitorWorldDataType } from "./types/index.js";

export const DEFAULT_VISITOR_DATA: VisitorDataObjectType = {
  coinsAvailable: 0, // Starting coins
  lastDateCoinsEarned: "",
  totalCoinsEarned: 0,
  decorationsOwned: {},
  seedsPurchased: {},
  worlds: {},
};

export const DEFAULT_VISITOR_WORLD_DATA: VisitorWorldDataType = {
  plotAssetId: null,
  claimedDate: "",
  plotSquares: {},
  crops: {},
  decorations: {},
};

export const DEFAULT_PLANT_DATA: CropDataObjectType = {
  ownerId: "",
  ownerName: "",
  dateDropped: "",
  lastWatered: "",
  seedId: 0,
  growLevel: 0,
  squareId: 0,
};
