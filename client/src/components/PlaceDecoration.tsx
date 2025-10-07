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
  const [isPlacing, setIsPlacing] = useState(false);

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
        <div className="modal-header flex gap-2 grid-cols-2">
          <h4 className="flex-grow text-left">Place Decoration in Slot {selectedSquare}</h4>
          <button
            disabled={isPlacing}
            onClick={() => {
              setSelectedSquare(null);
            }}
          >
            <img src="https://sdk-style.s3.amazonaws.com/icons/x.svg" style={{ width: "10px" }} />
          </button>
        </div>

        <div className="grid gap-2 grid-cols-2">
          {Object.values(decorations).map((decoration) => {
            const quantity = decorationsOwned[decoration.id]?.quantity || 0;
            const isOwned = quantity > 0;

            return (
              <div
                key={decoration.id}
                className={`card text-center ${!isOwned || isPlacing ? "opacity-50" : "cursor-pointer"}`}
                onClick={() => isOwned && handlePlaceDecoration(decoration.id)}
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
      </div>
    </div>
  );
};

export default PlaceDecoration;
