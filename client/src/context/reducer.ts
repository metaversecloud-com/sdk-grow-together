import {
  ActionType,
  InitialState,
  SET_ERROR,
  SET_GAME_STATE,
  SET_HAS_INTERACTIVE_PARAMS,
  SET_CROP_DATA,
  SET_VISITOR_DATA,
  SET_VISITOR_PLOT_DATA,
  SET_DECORATION_DATA,
} from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  switch (type) {
    case SET_HAS_INTERACTIVE_PARAMS:
      return {
        ...state,
        hasInteractiveParams: true,
      };
    case SET_GAME_STATE:
      return {
        ...state,
        isAdmin: payload.isAdmin,
        plotAssetData: payload.plotAssetData,
        visitorData: payload.visitorData,
        visitorPlotData: payload.visitorPlotData,
        error: "",
      };
    case SET_VISITOR_DATA:
      return {
        ...state,
        visitorData: payload.visitorData,
        error: "",
      };
    case SET_VISITOR_PLOT_DATA:
      return {
        ...state,
        visitorPlotData: payload.visitorPlotData,
        error: "",
      };
    case SET_CROP_DATA:
      return {
        ...state,
        cropData: payload.cropData,
        error: "",
      };
    case SET_DECORATION_DATA:
      return {
        ...state,
        decorationData: payload.decorationData,
        error: "",
      };
    case SET_ERROR:
      return {
        ...state,
        error: payload.error,
      };

    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
