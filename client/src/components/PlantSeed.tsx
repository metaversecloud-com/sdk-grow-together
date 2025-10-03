import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA, SET_VISITOR_PLOT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { seeds, VisitorDataObjectType } from "@shared/index.js";

interface PlantSeedProps {
  selectedSquare: number;
  setSelectedSquare: (square: number | null) => void;
  setIsUpdatingPlot: (isUpdatingPlot: boolean) => void;
  seedsPurchased: VisitorDataObjectType["seedsPurchased"];
}

export const PlantSeed = ({ selectedSquare, setSelectedSquare, setIsUpdatingPlot, seedsPurchased }: PlantSeedProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const [selectedSeedId, setSelectedSeedId] = useState<number | null>(null);
  const [isPlanting, setIsPlanting] = useState(false);

  const handlePlantSeed = async () => {
    if (!selectedSeedId || selectedSquare === null) return;

    setIsPlanting(true);
    setIsUpdatingPlot(true);

    await backendAPI
      .post("/plant/drop", {
        seedId: selectedSeedId,
        squareIndex: selectedSquare,
      })
      .then((response) => {
        const { visitorData, visitorPlotData } = response.data;
        dispatch!({
          type: SET_VISITOR_DATA,
          payload: { visitorData, error: "" },
        });
        dispatch!({
          type: SET_VISITOR_PLOT_DATA,
          payload: { visitorPlotData, error: "" },
        });
        setSelectedSquare(null);
        setSelectedSeedId(null);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setIsPlanting(false);
        setIsUpdatingPlot(false);
      });
  };

  return (
    <div className="card mt-4">
      <div className="card-details grid gap-4">
        <h4>Plant Seed in Square {selectedSquare}</h4>
        <p className="p3">Select a seed to plant:</p>

        <div className="grid gap-2 grid-cols-2">
          {Object.values(seeds).map((seed) => {
            const isFree = seed.cost === 0;
            const isPurchased = seedsPurchased[seed.id] || false;
            const isAvailable = isFree || isPurchased;

            return (
              <button
                key={seed.id}
                className={`btn btn-outline ${selectedSeedId === seed.id ? "btn-success-outline" : ""} 
                }`}
                disabled={!isAvailable || isPlanting}
                onClick={() => isAvailable && setSelectedSeedId(seed.id)}
              >
                <img className="mr-2" src={seed.icon} style={{ opacity: !isAvailable ? 0.5 : 1 }} />
                {seed.name}
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
  );
};

export default PlantSeed;
