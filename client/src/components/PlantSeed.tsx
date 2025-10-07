import { useContext, useState } from "react";

// components
import { ModalHeader } from "@/components";

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

  const [isPlanting, setIsPlanting] = useState(false);
  const hasSeeds = Object.keys(seedsPurchased).length > 0;

  const handlePlantSeed = async (seedId: number) => {
    if (!seedId || selectedSquare === null) return;

    setIsPlanting(true);
    setIsUpdatingPlot(true);

    await backendAPI
      .post("/crop/drop", {
        seedId: seedId,
        squareId: selectedSquare,
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
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={hasSeeds ? `Plant Seed in Slot ${selectedSquare}` : "No seeds unlocked"}
          disabled={isPlanting}
          handleOnClick={() => {
            setSelectedSquare(null);
          }}
        />

        {!hasSeeds ? (
          <p className="p2">Click “Buy Seeds” in the garden store to unlock your first seed.</p>
        ) : (
          <div className="grid gap-2 grid-cols-3">
            {Object.values(seeds).map((seed) => {
              const growthTimeInMinutes = (seed.growthTime * seed.harvestLevel) / 60;
              const isAvailable = seed.cost === 0 || seedsPurchased[seed.id];
              let buttonClass = "card card-horizontal";
              if (isAvailable && !isPlanting) buttonClass += " cursor-pointer available";

              return (
                <div
                  key={seed.id}
                  className={buttonClass}
                  onClick={() => isAvailable && handlePlantSeed(seed.id)}
                  style={{ gap: "0px" }}
                >
                  <img className="mb-2 m-auto" src={seed.icon} style={{ opacity: !isAvailable ? 0.5 : 1 }} />

                  <p className="p3">{seed.name}</p>
                  <p className="p4 text-muted">
                    {growthTimeInMinutes} min{growthTimeInMinutes > 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantSeed;
