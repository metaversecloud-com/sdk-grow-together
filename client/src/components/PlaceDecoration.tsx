import { useContext, useEffect, useState } from "react";

// components
import { ModalHeader, NoItems } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_SOUND_EFFECT, SET_VISITOR_INVENTORY, SET_VISITOR_PLOT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

interface PlaceDecorationProps {
  selectedSquareId: number;
  setSelectedSquareId: (square: number | null) => void;
  handleShowInventoryModal: (activeTab: string) => void;
}

export const PlaceDecoration = ({
  selectedSquareId,
  setSelectedSquareId,
  handleShowInventoryModal,
}: PlaceDecorationProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorInventory, plotData = { decorations: {} } } = useContext(GlobalStateContext);
  const { decorations } = visitorInventory || {};

  const [isPlacing, setIsPlacing] = useState(false);
  const [hasDecorations, setHasDecorations] = useState(false);
  const [hasPlacedDecorations, setHasPlacedDecorations] = useState(false);

  useEffect(() => {
    // Set hasDecorations to true if any decoration has availableQuantity > 0
    const hasAvailableDecorations =
      decorations && Object.values(decorations).some((decoration) => decoration.availableQuantity > 0);
    setHasDecorations(!!hasAvailableDecorations);

    // Check if any decorations have already been placed
    const placedDecorationCount = Object.keys(plotData.decorations || {}).length;
    setHasPlacedDecorations(placedDecorationCount > 0);
  }, [visitorInventory, decorations]);

  const handlePlaceDecoration = async (decorationName: string) => {
    if (!decorationName || selectedSquareId === null) return;

    setIsPlacing(true);

    await backendAPI
      .post("/decoration/drop", {
        decorationName,
        squareId: selectedSquareId,
      })
      .then((response) => {
        const { visitorInventory, plotData, soundEffect } = response.data;
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory, error: "" },
        });
        dispatch!({
          type: SET_SOUND_EFFECT,
          payload: { soundEffect },
        });
        dispatch!({
          type: SET_VISITOR_PLOT_DATA,
          payload: { plotData, error: "" },
        });
        setSelectedSquareId(null);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setIsPlacing(false);
      });
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={
            hasDecorations
              ? `Place Decoration in Slot ${selectedSquareId}`
              : hasPlacedDecorations
                ? "Buy More Decorations"
                : "No decorations unlocked"
          }
          disabled={isPlacing}
          handleOnClick={() => {
            setSelectedSquareId(null);
          }}
        />

        {!hasDecorations ? (
          <NoItems
            type="decorations"
            activeTab="decorations"
            closeModal={() => setSelectedSquareId(null)}
            handleShowInventoryModal={handleShowInventoryModal}
          />
        ) : (
          <div className="grid gap-2 grid-cols-2">
            {decorations &&
              Object.values(decorations)
                .filter((decoration) => {
                  // Only show decorations that are available in inventory
                  return decorations[decoration.name]?.availableQuantity > 0;
                })
                .map((decoration) => {
                  const available = decorations[decoration.name]?.availableQuantity || 0;
                  return (
                    <div
                      key={decoration.name}
                      className={`card menu-card text-center ${isPlacing ? "opacity-50" : "cursor-pointer"}`}
                      onClick={() => !isPlacing && handlePlaceDecoration(decoration.name)}
                    >
                      <img className="m-auto" src={decoration.icon} style={{ width: "40px" }} />
                      <div>
                        <div className="tooltip" style={{ maxWidth: "100%" }}>
                          <span className="tooltip-content">{decoration.name}</span>
                          <h6 className="card-title ellipsis bold">{decoration.name}</h6>
                        </div>
                        <p className="p3 p-0 text-muted">{available} available</p>
                      </div>
                    </div>
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceDecoration;
