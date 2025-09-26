import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

import { SEED_CONFIGS } from "@shared/types/SeedConfig";

interface PlantDetailsProps {
  plant: {
    dateDropped: string;
    seedId: number;
    growLevel: number;
    squareIndex: number;
    wasHarvested: boolean;
  };
  plantAssetId?: string;
  isReadOnly: boolean;
}

export const PlantDetails = ({ plant, plantAssetId, isReadOnly }: PlantDetailsProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const [isHarvesting, setIsHarvesting] = useState(false);

  const seedConfig = SEED_CONFIGS[plant.seedId];
  if (!seedConfig) {
    return (
      <div className="card danger">
        <div className="card-details">
          <p className="p2">Unknown plant type</p>
        </div>
      </div>
    );
  }

  const handleHarvest = async () => {
    if (!plantAssetId) return;

    try {
      setIsHarvesting(true);
      const response = await backendAPI.post("/plant/harvest", {
        droppedAssetId: plantAssetId,
      });

      // Show success message
      if (response.data.success) {
        dispatch!({
          type: SET_VISITOR_DATA,
          payload: { visitorData: response.data.visitorData, error: "" },
        });
        console.log(`Harvested! Earned ${response.data.coinsEarned} coins`);
      }
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
    } finally {
      setIsHarvesting(false);
    }
  };

  const calculateTimeRemaining = () => {
    const plantedTime = new Date(plant.dateDropped).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = (currentTime - plantedTime) / 1000;
    const totalGrowthTime = seedConfig.growthTime;
    const timePerLevel = totalGrowthTime / seedConfig.harvestLevel;
    const timeForNextLevel = (plant.growLevel + 1) * timePerLevel;
    const remainingSeconds = Math.max(0, timeForNextLevel - elapsedSeconds);

    if (remainingSeconds === 0 || plant.growLevel >= seedConfig.harvestLevel) {
      return null;
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    return `${minutes}m ${seconds}s`;
  };

  const getGrowthStatus = () => {
    if (plant.wasHarvested) return "Harvested";
    if (plant.growLevel >= seedConfig.harvestLevel) return "Ready for Harvest!";
    return `Growing... (Level ${plant.growLevel}/${seedConfig.harvestLevel})`;
  };

  const getGrowthColor = () => {
    if (plant.wasHarvested) return "text-muted";
    if (plant.growLevel >= seedConfig.harvestLevel) return "text-success";
    return "text-muted";
  };

  const timeRemaining = calculateTimeRemaining();

  return (
    <div className="grid gap-4">
      <img className="m-auto" src={seedConfig.icon} style={{ width: "40px" }} />
      <div className="flex-col text-center">
        <h3 className="card-title">{seedConfig.name}</h3>
        <p className={`p2 ${getGrowthColor()}`}>{getGrowthStatus()}</p>
      </div>

      <div className="flex-col grid gap-4">
        <div className="card small">
          <div className="card-details">
            <h4 className="h4">Growth Progress</h4>
            <div className="flex">
              <div className="flex-col" style={{ marginRight: "1rem" }}>
                <p className="p3">
                  Level: {plant.growLevel}/{seedConfig.harvestLevel}
                </p>
                <p className="p3">Planted: {new Date(plant.dateDropped).toLocaleString()}</p>
              </div>
              <div className="flex-col">
                {timeRemaining && <p className="p3">Next level: {timeRemaining}</p>}
                <p className="p3">Plot Square: {plant.squareIndex + 1}/16</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card small">
          <div className="card-details">
            <h4 className="h4">Seed Info</h4>
            <div className="flex">
              <div className="flex-col" style={{ marginRight: "1rem" }}>
                <p className="p3">Cost: {seedConfig.cost === 0 ? "Free" : `${seedConfig.cost} coins`}</p>
                <p className="p3">Growth Time: {Math.floor(seedConfig.growthTime / 60)}m</p>
              </div>
              <div className="flex-col">
                <p className="p3">Reward: {seedConfig.reward} coins</p>
                <p className="p3">Profit: +{seedConfig.reward - seedConfig.cost} coins</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Harvest button for current user */}
      {!isReadOnly && !plant.wasHarvested && plant.growLevel >= seedConfig.harvestLevel && (
        <div className="actions">
          <button className="btn" onClick={handleHarvest} disabled={isHarvesting}>
            {isHarvesting ? "Harvesting..." : `Harvest (+${seedConfig.reward} coins)`}
          </button>
        </div>
      )}

      {/* Already harvested */}
      {plant.wasHarvested && (
        <div className="card success">
          <div className="card-details">
            <p className="p2 text-center">Plant has been harvested!</p>
            <p className="p3 text-center">Earned {seedConfig.reward} coins</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantDetails;
