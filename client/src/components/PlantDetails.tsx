import { useContext, useState, useEffect } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_PLANT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { seeds, PlantDataObjectType, calculateNumberOfSquares } from "@shared/index.js";

interface PlantDetailsProps {
  plant: PlantDataObjectType;
  plotAssetId?: string | null;
  isReadOnly: boolean;
}

export const PlantDetails = ({ plant, plotAssetId, isReadOnly }: PlantDetailsProps) => {
  const dispatch = useContext(GlobalDispatchContext);

  const { lastWatered, growLevel, seedId, squareIndex, dateDropped } = plant;
  const seedConfig = seeds[seedId];
  const { name, icon, cost, reward, growthTime, harvestLevel } = seedConfig;

  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [readyForWater, setReadyForWater] = useState(false);
  const [readyForHarvest, setReadyForHarvest] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [wasHarvested, setWasHarvested] = useState(false);

  // Update timeRemaining every second until ready for harvest or harvested
  useEffect(() => {
    if (!seedConfig || wasHarvested) return setTimeRemaining(null);

    const getSecondsRemaining = () => {
      const lastWateredTime = new Date(lastWatered).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = (currentTime - lastWateredTime) / 1000;
      const timePerLevel = growthTime / harvestLevel;
      const timeForNextLevel = (growLevel + 1) * timePerLevel;
      const remainingSeconds = Math.max(0, timeForNextLevel - elapsedSeconds);

      if (!wasHarvested) {
        if (growLevel >= harvestLevel) setReadyForHarvest(true);
        else if (remainingSeconds <= 0) setReadyForWater(true);
      }

      return remainingSeconds <= 0 ? 0 : remainingSeconds;
    };

    const updateCountdown = () => {
      const remainingSeconds = getSecondsRemaining();
      if (remainingSeconds <= 0) return setTimeRemaining(null);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = Math.floor(remainingSeconds % 60);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastWatered, growLevel, seedConfig, harvestLevel, growthTime, wasHarvested]);

  if (!seedConfig) {
    return (
      <div className="card danger">
        <div className="card-details">
          <p className="p2">Unknown plant type</p>
        </div>
      </div>
    );
  }

  const handleWater = async () => {
    setIsWatering(true);
    await backendAPI
      .post("/plant/water")
      .then((response) => {
        const { success, plantData } = response.data;

        if (success) {
          dispatch!({
            type: SET_PLANT_DATA,
            payload: { plantData, error: "" },
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
      .post("/plant/harvest")
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
    if (wasHarvested) return "Harvested";
    else if (readyForHarvest) return "Ready for Harvest!";
    else if (readyForWater) return `Ready to Water!`;
    else if (growLevel < harvestLevel) return `Ready to water in: ${timeRemaining}`;
    else if (growLevel >= harvestLevel) return `Ready to harvest in: ${timeRemaining}`;

    return `Growing... (Level ${growLevel}/${harvestLevel})`;
  };

  const getGrowthColor = () => {
    if (readyForWater || readyForHarvest) return "text-success";
    return "text-muted";
  };

  return (
    <div className="grid gap-4">
      <img className="m-auto" src={icon} style={{ width: "40px" }} />
      <div className="text-center">
        <h3 className="card-title">{name}</h3>
        <p className={`p2 ${getGrowthColor()}`}>{getGrowthStatus()}</p>
      </div>

      <div className="card small">
        <div className="card-details" style={{ maxWidth: "100%" }}>
          <h4 className="h4">Growth Progress</h4>
          <div className="grid grid-cols-2">
            <div>
              <p className="p3">
                Level: {growLevel}/{harvestLevel}
              </p>
              <p className="p3">
                Plot Square: {squareIndex + 1}/{calculateNumberOfSquares(false)}
              </p>
            </div>
            <div className="text-right">
              <p className="p3">Planted: {new Date(dateDropped).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card small">
        <div className="card-details" style={{ maxWidth: "100%" }}>
          <h4 className="h4">Seed Info</h4>
          <div className="grid grid-cols-2">
            <div>
              <p className="p3">Cost: {cost === 0 ? "Free" : `${cost} coins`}</p>
              <p className="p3">Growth Time: {Math.floor(growthTime / 60)}m</p>
            </div>
            <div className="text-right">
              <p className="p3">Reward: {reward} coins</p>
              <p className="p3">Profit: +{reward - cost} coins</p>
            </div>
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
              <p className="p2 text-center">Plant has been harvested!</p>
              <p className="p3 text-center">Earned {reward} coins</p>
            </div>
          </div>
          {plotAssetId && (
            <button className="btn" onClick={handleOpenPlotIframe}>
              View Plot
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default PlantDetails;
