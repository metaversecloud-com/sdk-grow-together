import { useContext, useState, useEffect } from "react";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_CROP_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

// types
import { CropDataObjectType } from "@shared/index.js";

interface CropDetailsProps {
  crop: CropDataObjectType;
  plotAssetId?: string | null;
  isReadOnly: boolean;
}

export const CropDetails = ({ crop, plotAssetId, isReadOnly }: CropDetailsProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { seeds = {} } = useContext(GlobalStateContext);

  const { lastWatered, growLevel, ownerName, seedId } = crop;
  const seedConfig = seeds[seedId];
  const { name, reward, growthTime, harvestLevel, rarity } = seedConfig;

  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [readyForWater, setReadyForWater] = useState(false);
  const [readyForHarvest, setReadyForHarvest] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [wasHarvested, setWasHarvested] = useState(false);

  // Initialize audio with references to reuse them
  const waterAudio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/water_plant.mp3");
  const harvestAudio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/harvest_coins.mp3");

  // Set default volume for both audio elements (0.0 to 1.0)
  waterAudio.volume = 0.5; // 50% volume
  harvestAudio.volume = 0.7; // 70% volume

  // Update timeRemaining every second until ready for harvest or harvested
  useEffect(() => {
    if (!seedConfig || wasHarvested) return setTimeRemaining(null);

    const getSecondsRemaining = () => {
      const lastWateredTime = new Date(lastWatered).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = (currentTime - lastWateredTime) / 1000;
      const remainingSeconds = Math.max(0, growthTime - elapsedSeconds);

      if (!wasHarvested) {
        if (growLevel >= harvestLevel) setReadyForHarvest(true);
        else if (remainingSeconds <= 0) setReadyForWater(true);
      }

      return remainingSeconds <= 0 ? 0 : remainingSeconds;
    };

    const updateCountdown = () => {
      if (readyForWater) return;
      const remainingSeconds = getSecondsRemaining();

      if (remainingSeconds <= 0) return setTimeRemaining(null);

      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = Math.floor(remainingSeconds % 60);
      setTimeRemaining(`${minutes} min${minutes !== 1 ? "s" : ""} ${seconds > 0 ? `${seconds}s` : ""}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastWatered, growLevel, seedConfig, harvestLevel, growthTime, wasHarvested]);

  if (!seedConfig) {
    return (
      <div className="card danger">
        <div className="card-details">
          <p className="p2">Unknown crop type</p>
        </div>
      </div>
    );
  }

  const handleWater = async () => {
    setIsWatering(true);
    await backendAPI
      .post("/crop/water")
      .then((response) => {
        const { success, cropData } = response.data;
        if (success) {
          waterAudio.play();

          dispatch!({
            type: SET_CROP_DATA,
            payload: { cropData, error: "" },
          });
        }
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setReadyForWater(false);
        setIsWatering(false);
      });
  };

  const handleHarvest = async () => {
    setIsHarvesting(true);
    await backendAPI
      .post("/crop/harvest")
      .then((response) => {
        harvestAudio.play();
        setGameState(dispatch, response.data);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setReadyForHarvest(false);
        setIsHarvesting(false);
        setWasHarvested(true);
      });
  };

  const handleOpenPlotIframe = async () => {
    await backendAPI.post("/plot/view", { plotAssetId }).catch((error) => {
      setErrorMessage(dispatch, error as ErrorType);
    });
  };

  const getGrowthStatus = () => {
    if (isReadOnly) return `Owned by ${ownerName}`;
    else if (wasHarvested) return "Harvested";
    else if (readyForHarvest) return "Ready for Harvest!";
    else if (readyForWater) return `Ready to Water!`;
    else if (growLevel < harvestLevel) return `Ready to water in: ${timeRemaining}`;
    else if (growLevel >= harvestLevel) return `Ready to harvest in: ${timeRemaining}`;

    return `Growing... (Level ${growLevel}/${harvestLevel})`;
  };

  const getGrowthColor = () => {
    if (isReadOnly) return "chip-muted";
    if (readyForWater || readyForHarvest) return "chip-success";
  };

  return (
    <div className="grid gap-2">
      <div className="card small">
        <div className="card-details" style={{ maxWidth: "100%" }}>
          <img className="m-auto" src={seeds[seedId].icon} style={{ width: "40px" }} />
          <div className="text-center">
            <h3 className="card-title">{name}</h3>
            <p className="text-muted">
              <i>{rarity}</i>
            </p>
            <p>
              <i>
                Lvl {growLevel}/{harvestLevel}
              </i>
            </p>
            <p className="text-success">+{reward} Coins</p>
            <div className={`chip my-4 ${getGrowthColor()}`}>{getGrowthStatus()}</div>
          </div>
        </div>
      </div>

      {/* Water */}
      {!isReadOnly && readyForWater && (
        <button className="btn" onClick={handleWater} disabled={isWatering}>
          {isWatering ? "Watering..." : `Water (+1 growth level)`}
        </button>
      )}

      {/* Harvest */}
      {!isReadOnly && readyForHarvest && (
        <button className="btn" onClick={handleHarvest} disabled={isHarvesting}>
          {isHarvesting ? "Harvesting..." : `Harvest (+${reward} coins)`}
        </button>
      )}

      {/* Already harvested */}
      {wasHarvested && (
        <>
          <div className="card success">
            <div className="card-details">
              <p className="text-center">Earned {reward} coins</p>
            </div>
          </div>
        </>
      )}

      {plotAssetId && (
        <button className="btn btn-outline" onClick={handleOpenPlotIframe}>
          View Plot
        </button>
      )}
    </div>
  );
};

export default CropDetails;
