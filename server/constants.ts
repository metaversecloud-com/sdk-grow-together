import { CropDataObjectType, VisitorDataObjectType, VisitorWorldDataType } from "./types/index.js";

export const DEFAULT_VISITOR_DATA: VisitorDataObjectType = {
  lastDateCoinsEarned: "",
  totalCoinsEarned: 0,
  worlds: {},
};

export const DEFAULT_VISITOR_WORLD_DATA: VisitorWorldDataType = {
  plotAssetId: null,
  plotSignAssetId: null,
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
  seedId: "carrots",
  growLevel: 0,
  squareId: 0,
};
