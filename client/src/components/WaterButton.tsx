import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_CROP_DATA, SET_VISITOR_DATA, SET_VISITOR_PLOT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const WaterButton = ({
  cropAssetId,
  handleAfterWater,
  setAreButtonsDisabled,
}: {
  cropAssetId?: string;
  handleAfterWater: () => void;
  setAreButtonsDisabled?: (disabled: boolean) => void;
}) => {
  const dispatch = useContext(GlobalDispatchContext);

  const [isWatering, setIsWatering] = useState(false);

  const handleWater = async () => {
    if (setAreButtonsDisabled) setAreButtonsDisabled(true);
    setIsWatering(true);
    await backendAPI
      .post("/crop/water", { cropAssetId })
      .then((response) => {
        const { success, cropData, visitorData, visitorPlotData } = response.data;
        if (success) {
          const waterAudio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/water_plant.mp3");
          waterAudio.volume = 0.5; // 50% volume
          waterAudio.play();
        }

        dispatch!({
          type: SET_VISITOR_DATA,
          payload: { visitorData, error: "" },
        });
        dispatch!({
          type: SET_VISITOR_PLOT_DATA,
          payload: { visitorPlotData, error: "" },
        });
        dispatch!({
          type: SET_CROP_DATA,
          payload: { cropData, error: "" },
        });
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        if (setAreButtonsDisabled) setAreButtonsDisabled(false);
        setIsWatering(false);
        handleAfterWater();
      });
  };

  return (
    <button className="btn" onClick={handleWater} disabled={isWatering}>
      {isWatering ? "Watering..." : `Water (+1 growth level)`}
    </button>
  );
};

export default WaterButton;
