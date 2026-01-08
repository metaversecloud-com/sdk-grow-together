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
  SET_VISITOR_INVENTORY,
  SET_EARNED_MESSAGE,
  SET_SOUND_EFFECT,
  SET_DID_LEVEL_UP,
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
        ...payload,
        error: "",
      };
    case SET_VISITOR_INVENTORY:
      return {
        ...state,
        visitorInventory: payload.visitorInventory,
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
        plotData: payload.plotData,
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
    case SET_EARNED_MESSAGE:
      return {
        ...state,
        earnedMessage: payload.earnedMessage,
        error: "",
      };
    case SET_SOUND_EFFECT:
      return {
        ...state,
        soundEffect: payload.soundEffect,
        error: "",
      };
    case SET_DID_LEVEL_UP:
      return {
        ...state,
        didLevelUp: payload.didLevelUp,
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
