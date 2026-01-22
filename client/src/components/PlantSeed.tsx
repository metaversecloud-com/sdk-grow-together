import { useContext, useState } from "react";

// components
import { Loading, ModalHeader, NoItems } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

interface PlantSeedProps {
  selectedSquareId: number;
  setSelectedSquareId: (square: number | null) => void;
  handleShowInventoryModal: (activeTab: string) => void;
}

export const PlantSeed = ({ selectedSquareId, setSelectedSquareId, handleShowInventoryModal }: PlantSeedProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorInventory } = useContext(GlobalStateContext);
  const { seeds } = visitorInventory || {};

  const [isPlanting, setIsPlanting] = useState(false);

  const handlePlantSeed = async (seedName: string) => {
    if (!seedName || selectedSquareId === null) return;

    setIsPlanting(true);

    await backendAPI
      .post("/crop/drop", {
        seedName,
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
          text={
            seeds && Object.keys(seeds).length > 0 ? `Plant Seed in Slot ${selectedSquareId}` : "No seeds purchased"
          }
          disabled={isPlanting}
          handleOnClick={() => {
            setSelectedSquareId(null);
          }}
        />

        {seeds && Object.keys(seeds).length === 0 ? (
          <NoItems
            activeTab="seeds"
            closeModal={() => setSelectedSquareId(null)}
            handleShowInventoryModal={handleShowInventoryModal}
          />
        ) : (
          <div className="grid gap-2 grid-cols-3">
            {isPlanting ? (
              <div className="col-span-3">
                <Loading />
              </div>
            ) : (
              seeds &&
              Object.values(seeds).map((seed) => {
                const growthTimeInMinutes = (seed.growthTime * seed.harvestLevel) / 60;

                let buttonClass = "card card-horizontal menu-card";
                if (!isPlanting) buttonClass += " cursor-pointer available";

                return (
                  <div
                    key={seed.name}
                    className={buttonClass}
                    onClick={() => !isPlanting && handlePlantSeed(seed.name)}
                    style={{ gap: "0px" }}
                  >
                    <img className="mb-2 m-auto" src={seed.icon} />
                    <div className="tooltip" style={{ maxWidth: "100%" }}>
                      <span className="tooltip-content">{seed.name}</span>
                      <h6 className="card-title ellipsis bold">{seed.name}</h6>
                    </div>
                    <p className="p4 text-muted">
                      {growthTimeInMinutes} min{growthTimeInMinutes > 1 ? "s" : ""}
                    </p>
                    <p className="p4">
                      Profit: <span className="text-success">{seed.reward}</span>
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantSeed;
