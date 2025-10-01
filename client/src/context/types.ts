import {
  PlantDataObjectType,
  PlotAssetDataObjectType,
  VisitorDataObjectType,
  VisitorWorldDataType,
} from "@shared/types";

export const SET_HAS_INTERACTIVE_PARAMS = "SET_HAS_INTERACTIVE_PARAMS";
export const SET_GAME_STATE = "SET_GAME_STATE";
export const SET_ERROR = "SET_ERROR";
export const SET_VISITOR_DATA = "SET_VISITOR_DATA";
export const SET_VISITOR_PLOT_DATA = "SET_VISITOR_PLOT_DATA";
export const SET_PLANT_DATA = "SET_PLANT_DATA";

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
  PlantDataObjectType?: PlantDataObjectType;
  plantData?: PlantDataObjectType;
  plotAssetData?: PlotAssetDataObjectType;
  visitorData?: VisitorDataObjectType;
  visitorPlotData?: VisitorWorldDataType;
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
