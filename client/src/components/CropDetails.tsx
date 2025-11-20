import { useContext, useState, useEffect } from "react";

// components
import { HarvestButton, WaterButton } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, getSecondsRemaining, setErrorMessage } from "@/utils";

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
  const [wasHarvested, setWasHarvested] = useState(false);

  // Update timeRemaining every second until ready for harvest or harvested
  useEffect(() => {
    if (!seedConfig || wasHarvested) return setTimeRemaining(null);

    const updateCountdown = () => {
      if (readyForWater) return;
      const remainingSeconds = getSecondsRemaining(lastWatered, growthTime);

      if (!wasHarvested) {
        if (growLevel >= harvestLevel) setReadyForHarvest(true);
        else if (remainingSeconds <= 0) setReadyForWater(true);
      }

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

  const handleAfterHarvest = () => {
    setWasHarvested(true);
    setReadyForHarvest(false);
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
          <img className="m-auto" src={seeds[seedId].icon} style={{ width: "40px", height: "40px" }} />
          <div className="text-center">
            <h3 className="card-title bold">{name}</h3>
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
      {!isReadOnly && readyForWater && <WaterButton handleAfterWater={() => setReadyForWater(false)} />}

      {/* Harvest */}
      {!isReadOnly && readyForHarvest && <HarvestButton handleAfterHarvest={handleAfterHarvest} reward={reward} />}

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
