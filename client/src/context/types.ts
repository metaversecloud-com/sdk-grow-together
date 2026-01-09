import {
  CropDataObjectType,
  EcosystemInventoryItemType,
  PlacedDecorationDataObjectType,
  PlotAssetDataObjectType,
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
export const SET_EARNED_MESSAGE = "SET_EARNED_MESSAGE";
export const SET_SOUND_EFFECT = "SET_SOUND_EFFECT";
export const SET_DID_LEVEL_UP = "SET_DID_LEVEL_UP";

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
  visitorPlotAssetId?: string;
  plotData?: VisitorWorldDataType;
  decorations?: { [key: string]: EcosystemInventoryItemType };
  seeds?: { [key: string]: EcosystemInventoryItemType };
  tools?: { [key: string]: EcosystemInventoryItemType };
  xp?: number;
  earnedMessage?: { message?: string; multiplier?: string };
  soundEffect?: string;
  didLevelUp?: boolean;
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
  appliedTools?: string[];
};
