import { CropDataObjectType, VisitorDataObjectType, VisitorWorldDataType } from "./types/index.js";

export const DEFAULT_VISITOR_DATA: VisitorDataObjectType = {
  lastDateCoinsEarned: "",
  totalCoinsEarned: 0,
  placedDecorations: {},
  worlds: {},
};

export const DEFAULT_VISITOR_WORLD_DATA: VisitorWorldDataType = {
  plotAssetId: null,
  plotSignAssetId: null,
  claimedDate: "",
  lastInteractionDate: "",
  plotSquares: {},
  crops: {},
  decorations: {},
};

export const DEFAULT_PLANT_DATA: CropDataObjectType = {
  ownerId: "",
  ownerName: "",
  dateDropped: "",
  lastWatered: "",
  seedId: "carrots",
  growLevel: 0,
  squareId: 0,
};
