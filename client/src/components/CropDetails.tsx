import { useContext, useState, useEffect } from "react";

// components
import { AppliedToolIcons, EarnedMessage, HarvestButton, UseToolModal, WaterButton } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";
import { CropDataObjectType, getSecondsRemaining, getSeedConfig } from "@shared/index.js";

interface CropDetailsProps {
  crop: CropDataObjectType;
  plotAssetId?: string | null;
  ownerId?: string;
  isOwnedByCurrentUser: boolean;
}

export const CropDetails = ({
  crop,
  plotAssetId: visitorPlotAssetId,
  ownerId,
  isOwnedByCurrentUser,
}: CropDetailsProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { ecosystemSeeds = {} } = useContext(GlobalStateContext);

  const { plotAssetId: cropPlotAssetId, lastWatered, growLevel, ownerName, appliedTools = [] } = crop;
  const seedConfig = getSeedConfig(ecosystemSeeds, crop);
  const { name, reward, growthTime, harvestLevel, rarity } = seedConfig;

  let plotAssetId = cropPlotAssetId;
  if (isOwnedByCurrentUser && !cropPlotAssetId && visitorPlotAssetId) plotAssetId = visitorPlotAssetId;

  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isReadyToWater, setIsReadyToWater] = useState(false);
  const [isReadyToHarvest, setIsReadyToHarvest] = useState(false);
  const [wasHarvested, setWasHarvested] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);

  // Update timeRemaining every second until ready for harvest or harvested
  useEffect(() => {
    if (!seedConfig || wasHarvested) return setTimeRemaining(null);

    const updateCountdown = () => {
      if (isReadyToWater) return;
      const remainingSeconds = getSecondsRemaining(lastWatered, growthTime, appliedTools);

      if (!wasHarvested) {
        if (growLevel >= harvestLevel) setIsReadyToHarvest(true);
        else if (remainingSeconds <= 0) setIsReadyToWater(true);
      }

      if (remainingSeconds <= 0) return setTimeRemaining(null);

      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = Math.floor(remainingSeconds % 60);
      setTimeRemaining(`${minutes} min${minutes !== 1 ? "s" : ""} ${seconds > 0 ? `${seconds}s` : ""}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastWatered, growLevel, seedConfig, harvestLevel, growthTime, wasHarvested, appliedTools]);

  const handleAfterUseTool = () => {
    setIsReadyToWater(false);
  };

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
    setIsReadyToHarvest(false);
  };

  const handleOpenPlotIframe = async () => {
    await backendAPI.post("/plot/view", { plotAssetId }).catch((error) => {
      setErrorMessage(dispatch, error as ErrorType);
    });
  };

  const getGrowthStatus = () => {
    if (wasHarvested) return "Harvested";
    else if (isReadyToHarvest) return "Ready for Harvest!";
    else if (isReadyToWater) return `Ready to Water!`;
    else if (growLevel < harvestLevel) return `Ready to water in: ${timeRemaining}`;
    else if (growLevel >= harvestLevel) return `Ready to harvest in: ${timeRemaining}`;

    return `Growing... (Level ${growLevel}/${harvestLevel})`;
  };

  return (
    <>
      {!isOwnedByCurrentUser && <div className="chip chip-muted mb-2 mr-auto">{`${ownerName}'s Garden`}</div>}

      <div className="grid gap-2">
        <div className="card small">
          <AppliedToolIcons appliedTools={appliedTools} />
          <div className="card-details" style={{ maxWidth: "100%", marginLeft: "-30px" }}>
            <img className="m-auto" src={seedConfig.icon} style={{ width: "40px", height: "40px" }} />
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
              <div className={`chip my-4 ${isReadyToWater || isReadyToHarvest ? "chip-success" : ""}`}>
                {getGrowthStatus()}
              </div>
            </div>
          </div>
        </div>

        <EarnedMessage isOwnedByCurrentUser={isOwnedByCurrentUser} />

        {/* Action Buttons */}
        {((!isOwnedByCurrentUser && isReadyToWater) || !isReadyToWater) &&
          !isReadyToHarvest &&
          !wasHarvested &&
          appliedTools?.length < 3 && (
            <button id="useTool" className="btn btn-outline tool" onClick={() => setShowToolModal(true)}>
              Use Tool
            </button>
          )}

        {isOwnedByCurrentUser && isReadyToWater && <WaterButton handleAfterWater={() => setIsReadyToWater(false)} />}

        {isOwnedByCurrentUser && isReadyToHarvest && (
          <HarvestButton handleAfterHarvest={handleAfterHarvest} reward={reward} />
        )}

        {plotAssetId && (
          <button className="btn btn-outline" onClick={handleOpenPlotIframe}>
            View Plot
          </button>
        )}

        {/* Tool Modal */}
        {showToolModal && (
          <UseToolModal
            selectedSquareId={crop.squareId}
            ownerId={ownerId}
            isOwnedByCurrentUser={isOwnedByCurrentUser}
            isReadyToWater={isReadyToWater}
            appliedTools={appliedTools}
            closeToolModal={() => setShowToolModal(false)}
            handleAfterUseTool={() => handleAfterUseTool()}
          />
        )}
      </div>
    </>
  );
};

export default CropDetails;
