import { useContext, useEffect, useState } from "react";

// components
import { ModalHeader } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_INVENTORY, SET_VISITOR_PLOT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

interface PlaceDecorationProps {
  selectedSquareId: number;
  setSelectedSquareId: (square: number | null) => void;
}

export const PlaceDecoration = ({ selectedSquareId, setSelectedSquareId }: PlaceDecorationProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorInventory, visitorPlotData = { decorations: {} } } = useContext(GlobalStateContext);
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
    const placedDecorationCount = Object.keys(visitorPlotData.decorations || {}).length;
    setHasPlacedDecorations(placedDecorationCount > 0);
  }, [visitorInventory, decorations]);

  const handlePlaceDecoration = async (decorationId: string) => {
    if (!decorationId || selectedSquareId === null) return;

    setIsPlacing(true);

    await backendAPI
      .post("/decoration/drop", {
        decorationId,
        squareId: selectedSquareId,
      })
      .then((response) => {
        const { visitorInventory, visitorPlotData } = response.data;
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory, error: "" },
        });
        dispatch!({
          type: SET_VISITOR_PLOT_DATA,
          payload: { visitorPlotData, error: "" },
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
          Object.keys(visitorPlotData.decorations).length > 0 ? (
            <p>You've added all of your decorations. You'll need to buy more from the store or remove one.</p>
          ) : (
            <p className="p2">Click “Buy Decorations” in the garden store to unlock your first decoration.</p>
          )
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
                      key={decoration.id}
                      className={`card menu-card text-center ${isPlacing ? "opacity-50" : "cursor-pointer"}`}
                      onClick={() => !isPlacing && handlePlaceDecoration(decoration.id)}
                    >
                      <img className="mr-2" src={decoration.icon} />
                      <div>
                        <p className="p2 p-0">
                          <strong>{decoration.name}</strong>
                        </p>
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
