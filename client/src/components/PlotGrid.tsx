import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { seeds, VisitorDataType } from "@shared/index.js";

interface PlotGridProps {
  plotSquares: { [key: number]: string | null };
  plants: VisitorDataType["plants"];
  isReadOnly: boolean;
  gameState?: VisitorDataType;
  onStateUpdate?: () => void;
}

export const PlotGrid = ({ plotSquares, plants, isReadOnly, gameState, onStateUpdate }: PlotGridProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [selectedSeedId, setSelectedSeedId] = useState<number | null>(null);
  const [isPlanting, setIsPlanting] = useState(false);

  const handleSquareClick = (squareIndex: number) => {
    if (isReadOnly || plotSquares[squareIndex]) return;

    setSelectedSquare(selectedSquare === squareIndex ? null : squareIndex);
  };

  const handlePlantSeed = async () => {
    if (!selectedSeedId || selectedSquare === null) return;

    try {
      setIsPlanting(true);
      await backendAPI.post("/plant/drop", {
        seedId: selectedSeedId,
        squareIndex: selectedSquare,
      });

      setSelectedSquare(null);
      setSelectedSeedId(null);
      onStateUpdate?.();
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
    } finally {
      setIsPlanting(false);
    }
  };

  const renderSquare = (squareIndex: number) => {
    const plantAssetId = plotSquares[squareIndex];
    const plant = plantAssetId ? plants[plantAssetId] : null;
    const isEmpty = !plantAssetId;
    const isSelected = selectedSquare === squareIndex;

    let squareClass = "card small flex items-center justify-center";
    if (isEmpty && !isReadOnly && !isPlanting) {
      squareClass += " cursor-pointer";
      if (isSelected) squareClass += " success";
    }
    if (plant?.wasHarvested) {
      squareClass += " opacity-50";
    }

    return (
      <div
        key={squareIndex}
        className={squareClass}
        style={{ minHeight: "70px" }}
        onClick={() => handleSquareClick(squareIndex)}
      >
        <div className="card-details text-center">
          {plant && !plant.wasHarvested ? (
            <div>
              <img className="m-auto" src={seeds[plant.seedId].icon} />
              <p className="p4 text-muted">
                Lv {plant.growLevel}/{seeds[plant.seedId]?.harvestLevel || 10}
              </p>
              {plant.growLevel >= (seeds[plant.seedId]?.harvestLevel || 10) && (
                <p className="p4 text-success">Ready!</p>
              )}
            </div>
          ) : plant && plant.wasHarvested ? (
            <p className="p4 text-muted">Harvested</p>
          ) : (
            <p className="p3 text-muted">{isReadOnly ? "Empty" : "+"}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-col">
      <h3 className="h3 text-center py-4">Garden Plot (4x4)</h3>

      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {Array.from({ length: 16 }, (_, i) => renderSquare(i))}
      </div>

      {!isReadOnly && selectedSquare !== null && (
        <div className="card mt-4">
          <div className="card-details grid gap-4">
            <h4>Plant Seed in Square {selectedSquare}</h4>
            <p className="p3">Select a seed to plant:</p>

            <div className="grid gap-2">
              {Object.values(seeds).map((seed) => {
                const isFree = seed.cost === 0;
                const isPurchased = gameState?.seedsPurchased[seed.id] || false;
                const isAvailable = isFree || isPurchased;

                return (
                  <button
                    key={seed.id}
                    className={`btn btn-outline ${selectedSeedId === seed.id ? "btn-success-outline" : ""} ${
                      !isAvailable ? "opacity-50" : ""
                    }`}
                    disabled={!isAvailable || isPlanting}
                    onClick={() => isAvailable && setSelectedSeedId(seed.id)}
                  >
                    <img className="mr-2" src={seed.icon} />
                    {seed.name}
                    {!isAvailable && " (Not purchased)"}
                  </button>
                );
              })}
            </div>

            <div className="flex">
              <button className="btn" onClick={handlePlantSeed} disabled={!selectedSeedId || isPlanting}>
                {isPlanting ? "Planting..." : "Plant Seed"}
              </button>
              <button
                className="btn btn-text"
                onClick={() => {
                  setSelectedSquare(null);
                  setSelectedSeedId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotGrid;
