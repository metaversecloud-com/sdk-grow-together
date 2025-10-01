import {
  ActionType,
  InitialState,
  SET_ERROR,
  SET_GAME_STATE,
  SET_HAS_INTERACTIVE_PARAMS,
  SET_PLANT_DATA,
  SET_VISITOR_DATA,
  SET_VISITOR_PLOT_DATA,
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
    case SET_PLANT_DATA:
      return {
        ...state,
        plantData: payload.plantData,
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
