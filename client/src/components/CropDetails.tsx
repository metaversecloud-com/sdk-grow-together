import { useContext, useState, useEffect } from "react";

// components
import { AppliedToolIcons, HarvestButton, UseToolModal, WaterButton } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_EARNED_MESSAGE } from "@/context/types";

// utils
import { backendAPI, getSecondsRemaining, setErrorMessage } from "@/utils";

// types
import { CropDataObjectType } from "@shared/index.js";

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
  const { seeds = {}, earnedMessage } = useContext(GlobalStateContext);

  const { plotAssetId: cropPlotAssetId, lastWatered, growLevel, ownerName, seedId, appliedTools = [] } = crop;
  const seedConfig = seeds[seedId];
  const { name, reward, growthTime, harvestLevel, rarity } = seedConfig;

  let plotAssetId = cropPlotAssetId;
  if (isOwnedByCurrentUser && !cropPlotAssetId && visitorPlotAssetId) plotAssetId = visitorPlotAssetId;

  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isReadyToWater, setIsReadyForWater] = useState(false);
  const [isReadyToHarvest, setIsReadyForHarvest] = useState(false);
  const [wasHarvested, setWasHarvested] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);

  // Update timeRemaining every second until ready for harvest or harvested
  useEffect(() => {
    if (!seedConfig || wasHarvested) return setTimeRemaining(null);

    const updateCountdown = () => {
      if (isReadyToWater) return;
      const remainingSeconds = getSecondsRemaining(lastWatered, growthTime, appliedTools);

      if (!wasHarvested) {
        if (growLevel >= harvestLevel) setIsReadyForHarvest(true);
        else if (remainingSeconds <= 0) setIsReadyForWater(true);
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

  useEffect(() => {
    if (earnedMessage) {
      // Clear the earned message after displaying it for 10 seconds
      setTimeout(() => {
        dispatch!({
          type: SET_EARNED_MESSAGE,
          payload: { earnedMessage: undefined },
        });
      }, 10000);
    }
  }, [earnedMessage]);

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
    setIsReadyForHarvest(false);
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
              <div className={`chip my-4 ${isReadyToWater || isReadyToHarvest ? "chip-success" : ""}`}>
                {getGrowthStatus()}
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Earned (by non-owners) */}
        {!isOwnedByCurrentUser && earnedMessage && (
          <>
            <div className="card success">
              <div className="card-details">
                <p className="text-center text-success">{earnedMessage}</p>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {!isReadyToHarvest && !wasHarvested && appliedTools?.length < 3 && (
          <button id="useTool" className="btn btn-outline tool" onClick={() => setShowToolModal(true)}>
            Use Tool
          </button>
        )}

        {isOwnedByCurrentUser && isReadyToWater && <WaterButton handleAfterWater={() => setIsReadyForWater(false)} />}

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
            handleAfterWater={() => setIsReadyForWater(false)}
          />
        )}
      </div>
    </>
  );
};

export default CropDetails;
