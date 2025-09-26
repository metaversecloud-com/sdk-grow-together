import { PlotAssetDataObject } from "@shared/types/PlotData";
import { VisitorData } from "@shared/types/VisitorData";

export const SET_HAS_INTERACTIVE_PARAMS = "SET_HAS_INTERACTIVE_PARAMS";
export const SET_GAME_STATE = "SET_GAME_STATE";
export const SET_ERROR = "SET_ERROR";
export const SET_VISITOR_DATA = "SET_VISITOR_DATA";

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
  plotData?: PlotAssetDataObject;
  visitorData?: VisitorData;
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
