import { useContext, useState } from "react";

// components
import { ModalHeader } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

interface PlantSeedProps {
  selectedSquareId: number;
  setSelectedSquareId: (square: number | null) => void;
}

export const PlantSeed = ({ selectedSquareId, setSelectedSquareId }: PlantSeedProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorInventory } = useContext(GlobalStateContext);
  const { seeds } = visitorInventory || {};

  const [isPlanting, setIsPlanting] = useState(false);

  const handlePlantSeed = async (seedId: string) => {
    if (!seedId || selectedSquareId === null) return;

    setIsPlanting(true);

    await backendAPI
      .post("/crop/drop", {
        seedId: seedId,
        squareId: selectedSquareId,
      })
      .then((response) => {
        setGameState(dispatch, response.data);
        setSelectedSquareId(null);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setIsPlanting(false);
      });
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={seeds && Object.keys(seeds).length > 0 ? `Plant Seed in Slot ${selectedSquareId}` : "No seeds unlocked"}
          disabled={isPlanting}
          handleOnClick={() => {
            setSelectedSquareId(null);
          }}
        />

        {seeds && Object.keys(seeds).length === 0 ? (
          <p className="p2">Click “Buy Seeds” in the garden store to unlock your first seed.</p>
        ) : (
          <div className="grid gap-2 grid-cols-3">
            {seeds &&
              Object.values(seeds).map((seed) => {
                const growthTimeInMinutes = (seed.growthTime * seed.harvestLevel) / 60;
                const isAvailable = seed.cost === 0 || seeds[seed.name]?.quantity > 0;
                if (!isAvailable) return null;

                let buttonClass = "card card-horizontal menu-card";
                if (isAvailable && !isPlanting) buttonClass += " cursor-pointer available";

                return (
                  <div
                    key={seed.id}
                    className={buttonClass}
                    onClick={() => isAvailable && !isPlanting && handlePlantSeed(seed.id)}
                    style={{ gap: "0px" }}
                  >
                    <img
                      className="m-auto"
                      src={seed.icon}
                      style={{ width: "40px", opacity: !isAvailable ? 0.5 : 1 }}
                    />

                    <div className="tooltip" style={{ maxWidth: "100%" }}>
                      <span className="tooltip-content">{seed.name}</span>
                      <h6 className="card-title ellipsis bold">{seed.name}</h6>
                    </div>
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
