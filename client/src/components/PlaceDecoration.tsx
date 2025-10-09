import { useContext, useState } from "react";

// components
import { ModalHeader } from "@/components";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA, SET_VISITOR_PLOT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { decorations, VisitorDataObjectType } from "@shared/index.js";

interface PlaceDecorationProps {
  selectedSquare: number;
  setSelectedSquare: (square: number | null) => void;
  setIsUpdatingPlot: (isUpdatingPlot: boolean) => void;
  decorationsOwned: VisitorDataObjectType["decorationsOwned"];
}

export const PlaceDecoration = ({
  selectedSquare,
  setSelectedSquare,
  setIsUpdatingPlot,
  decorationsOwned,
}: PlaceDecorationProps) => {
  const dispatch = useContext(GlobalDispatchContext);

  const [isPlacing, setIsPlacing] = useState(false);
  const hasDecorations = Object.keys(decorationsOwned).length > 0;

  const handlePlaceDecoration = async (decorationId: number) => {
    if (!decorationId || selectedSquare === null) return;

    setIsPlacing(true);
    setIsUpdatingPlot(true);

    await backendAPI
      .post("/decoration/drop", {
        decorationId,
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
        setIsPlacing(false);
        setIsUpdatingPlot(false);
      });
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={hasDecorations ? `Place Decoration in Slot ${selectedSquare}` : "No decorations unlocked"}
          disabled={isPlacing}
          handleOnClick={() => {
            setSelectedSquare(null);
          }}
        />

        {!hasDecorations ? (
          <p className="p2">Click “Buy Decorations” in the garden store to unlock your first decoration.</p>
        ) : (
          <div className="grid gap-2 grid-cols-2">
            {Object.values(decorations).map((decoration) => {
              const available = decorationsOwned[decoration.id]?.available || 0;
              const canPlace = available > 0;

              return (
                <div
                  key={decoration.id}
                  className={`card text-center ${!canPlace || isPlacing ? "opacity-50" : "cursor-pointer"}`}
                  onClick={() => canPlace && handlePlaceDecoration(decoration.id)}
                >
                  <img className="mr-2" src={decoration.imageSrc} />
                  <div>
                    <p className="p2 p-0">{decoration.name}</p>
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
