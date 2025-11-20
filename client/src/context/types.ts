import {
  CropDataObjectType,
  DecorationType,
  PlacedDecorationDataObjectType,
  PlotAssetDataObjectType,
  SeedType,
  VisitorDataObjectType,
  VisitorInventoryType,
  VisitorWorldDataType,
} from "@shared/types";

export const SET_HAS_INTERACTIVE_PARAMS = "SET_HAS_INTERACTIVE_PARAMS";
export const SET_GAME_STATE = "SET_GAME_STATE";
export const SET_ERROR = "SET_ERROR";
export const SET_VISITOR_INVENTORY = "SET_VISITOR_INVENTORY";
export const SET_VISITOR_DATA = "SET_VISITOR_DATA";
export const SET_VISITOR_PLOT_DATA = "SET_VISITOR_PLOT_DATA";
export const SET_CROP_DATA = "SET_CROP_DATA";
export const SET_DECORATION_DATA = "SET_DECORATION_DATA";

export type InteractiveParams = {
  assetId: string;
  displayName: string;
  identityId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: string;
};

export interface InitialState {
  isAdmin?: boolean;
  error?: string;
  hasInteractiveParams?: boolean;
  cropData?: CropDataObjectType;
  decorationData?: PlacedDecorationDataObjectType;
  noOfAvailablePlots?: number;
  plotAssetData?: PlotAssetDataObjectType;
  visitorInventory?: VisitorInventoryType;
  visitorData?: VisitorDataObjectType;
  visitorPlotData?: VisitorWorldDataType;
  decorations?: { [key: string]: DecorationType };
  seeds?: { [key: string]: SeedType };
}

export type ActionType = {
  type: string;
  payload: InitialState;
};

export type ErrorType =
  | string
  | {
      message?: string;
      response?: { data?: { error?: { message?: string }; message?: string } };
    };

export type SelectedSquareDetails = {
  isEmpty?: boolean;
  title?: string;
  icon?: string;
  name?: string;
  growLevel?: number;
  harvestLevel?: number;
  reward?: number;
  isReadyToWater?: boolean;
  isReadyToHarvest?: boolean;
};
