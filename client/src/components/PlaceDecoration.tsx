import { useContext, useEffect, useState } from "react";

// components
import { ModalHeader } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_INVENTORY, SET_VISITOR_PLOT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

interface PlaceDecorationProps {
  selectedSquare: number;
  setSelectedSquare: (square: number | null) => void;
  setIsUpdatingPlot: (isUpdatingPlot: boolean) => void;
}

export const PlaceDecoration = ({ selectedSquare, setSelectedSquare, setIsUpdatingPlot }: PlaceDecorationProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const {
    decorations = {},
    visitorInventory = {},
    visitorPlotData = { decorations: {} },
  } = useContext(GlobalStateContext);

  const [isPlacing, setIsPlacing] = useState(false);
  const [hasDecorations, setHasDecorations] = useState(false);
  const [hasPlacedDecorations, setHasPlacedDecorations] = useState(false);

  useEffect(() => {
    // Check if any keys in visitorInventory exist in decorations
    const hasAvailableDecorations = Object.keys(visitorInventory).some((key) => {
      // Look for a decoration with name that matches the visitorInventory key
      const matchingDecoration = Object.values(decorations).find(
        (decoration) => decoration.name.toLowerCase() === key.toLowerCase(),
      );
      return matchingDecoration && visitorInventory[key]?.quantity > 0;
    });
    setHasDecorations(hasAvailableDecorations);

    // Check if any decorations have already been placed
    const placedDecorationCount = Object.keys(visitorPlotData.decorations || {}).length;
    setHasPlacedDecorations(placedDecorationCount > 0);
  }, [visitorInventory, decorations]);

  const handlePlaceDecoration = async (decorationId: string) => {
    if (!decorationId || selectedSquare === null) return;

    setIsPlacing(true);
    setIsUpdatingPlot(true);

    await backendAPI
      .post("/decoration/drop", {
        decorationId,
        squareId: selectedSquare,
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
        setSelectedSquare(null);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setIsPlacing(false);
        setIsUpdatingPlot(false);
      });
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={
            hasDecorations
              ? `Place Decoration in Slot ${selectedSquare}`
              : hasPlacedDecorations
                ? "Buy More Decorations"
                : "No decorations unlocked"
          }
          disabled={isPlacing}
          handleOnClick={() => {
            setSelectedSquare(null);
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
            {Object.values(decorations)
              .filter((decoration) => {
                // Only show decorations that are available in inventory
                const available = visitorInventory[decoration.name]?.quantity || 0;
                return available > 0;
              })
              .map((decoration) => {
                const available = visitorInventory[decoration.name]?.quantity || 0;

                return (
                  <div
                    key={decoration.id}
                    className={`card text-center ${isPlacing ? "opacity-50" : "cursor-pointer"}`}
                    onClick={() => !isPlacing && handlePlaceDecoration(decoration.id)}
                  >
                    <img className="mr-2" src={decoration.icon} />
                    <div>
                      <p className="p2 p-0">{decoration.name}</p>
                      <p className="p3 p-0 text-muted">{available} available</p>
                    </div>
                  </div>
                );
              })}
            {/* {Object.values(decorations).map((decoration) => {
              const available = visitorInventory[decoration.name]?.quantity || 0;
              const canPlace = available > 0;

              return (
                <div
                  key={decoration.id}
                  className={`card text-center ${!canPlace || isPlacing ? "opacity-50" : "cursor-pointer"}`}
                  onClick={() => canPlace && handlePlaceDecoration(decoration.id)}
                >
                  <img className="mr-2" src={decoration.icon} />
                  <div>
                    <p className="p2 p-0">{decoration.name}</p>
                    <p className="p3 p-0 text-muted">{available} available</p>
                  </div>
                </div>
              );
            })} */}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceDecoration;
