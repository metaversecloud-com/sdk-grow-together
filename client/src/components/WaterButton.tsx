import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

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
        setGameState(dispatch, response.data);
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
