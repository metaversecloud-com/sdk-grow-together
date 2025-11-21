import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

export const HarvestButton = ({
  setAreButtonsDisabled,
  handleAfterHarvest,
  cropAssetId,
  reward,
}: {
  setAreButtonsDisabled?: (disabled: boolean) => void;
  handleAfterHarvest: () => void;
  cropAssetId?: string;
  reward: number;
}) => {
  const dispatch = useContext(GlobalDispatchContext);

  const [isHarvesting, setIsHarvesting] = useState(false);

  const handleHarvest = async () => {
    if (setAreButtonsDisabled) setAreButtonsDisabled(true);
    setIsHarvesting(true);
    await backendAPI
      .post("/crop/harvest", { cropAssetId })
      .then((response) => {
        if (response.data.success) {
          const harvestAudio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/harvest_coins.mp3");
          harvestAudio.volume = 0.7; // 70% volume
          harvestAudio.play();
        }
        setGameState(dispatch, response.data);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        if (setAreButtonsDisabled) setAreButtonsDisabled(false);
        setIsHarvesting(false);
        handleAfterHarvest();
      });
  };

  return (
    <button className="btn btn-success" onClick={handleHarvest} disabled={isHarvesting}>
      {isHarvesting ? "Harvesting..." : `Harvest (+${reward} coins)`}
    </button>
  );
};

export default HarvestButton;
