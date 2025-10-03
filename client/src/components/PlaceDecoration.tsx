import { useContext, useState } from "react";

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
  const [selectedDecorationId, setSelectedDecorationId] = useState<number | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const handlePlaceDecoration = async () => {
    if (!selectedDecorationId || selectedSquare === null) return;

    setIsPlacing(true);
    setIsUpdatingPlot(true);

    await backendAPI
      .post("/decoration/drop", {
        decorationId: selectedDecorationId,
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
        setSelectedDecorationId(null);
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
    <div className="card mt-4">
      <div className="card-details grid gap-4">
        <h4>Place Decoration in Square {selectedSquare}</h4>
        <p className="p3">Select a decoration to place:</p>

        <div className="grid gap-2 grid-cols-2">
          {Object.values(decorations).map((decoration) => {
            const quantity = decorationsOwned[decoration.id]?.quantity || 0;
            const isOwned = quantity > 0;

            return (
              <div
                key={decoration.id}
                className={`card text-center ${selectedDecorationId === decoration.id ? "card-success" : ""} ${
                  !isOwned ? "opacity-50" : "cursor-pointer"
                }`}
                onClick={() => isOwned && setSelectedDecorationId(decoration.id)}
              >
                <img className="mr-2" src={decoration.imageSrc} />
                <div>
                  <p className="p2 p-0">{decoration.name}</p>
                  <p className="p3 p-0 text-muted">{quantity} available</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex">
          <button className="btn" onClick={handlePlaceDecoration} disabled={!selectedDecorationId || isPlacing}>
            {isPlacing ? "Placing..." : "Place"}
          </button>
          <button
            className="btn btn-text"
            onClick={() => {
              setSelectedSquare(null);
              setSelectedDecorationId(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceDecoration;
