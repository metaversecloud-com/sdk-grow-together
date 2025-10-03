import { useContext, useState } from "react";

// components
import { ConfirmationModal, PlaceDecoration, PlantSeed } from "@/components";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA, SET_VISITOR_PLOT_DATA } from "@/context/types";

// types
import { decorations, plotConfig, seeds, VisitorDataObjectType, VisitorWorldDataType } from "@shared/index.js";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

interface PlotGridProps {
  plotSquares: { [key: number]: string | null };
  plants: VisitorWorldDataType["plants"];
  placedDecorations: VisitorWorldDataType["decorations"];
  isReadOnly: boolean;
  visitorData?: VisitorDataObjectType;
}

export const PlotGrid = ({ plotSquares, plants, placedDecorations, isReadOnly, visitorData }: PlotGridProps) => {
  const dispatch = useContext(GlobalDispatchContext);

  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [isUpdatingPlot, setIsUpdatingPlot] = useState(false);
  const [showRemovePlantModal, setShowRemovePlantModal] = useState(false);
  const [showRemoveDecorationModal, setShowRemoveDecorationModal] = useState(false);

  const handleSquareClick = (squareIndex: number) => {
    if (isReadOnly) return;

    setSelectedSquare(selectedSquare === squareIndex ? null : squareIndex);

    if (plotSquares[squareIndex] && plants[plotSquares[squareIndex]]) setShowRemovePlantModal(true);
    else if (plotSquares[squareIndex] && placedDecorations[plotSquares[squareIndex]])
      setShowRemoveDecorationModal(true);
  };

  const handleCancelRemove = () => {
    setShowRemovePlantModal(false);
    setShowRemoveDecorationModal(false);
    setSelectedSquare(null);
  };

  const handleClearSquare = async ({ type }: { type: "plant" | "decoration" }) => {
    await backendAPI
      .post(`/${type}/remove`, {
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
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setShowRemovePlantModal(false);
        setShowRemoveDecorationModal(false);
      });
  };

  const renderSquare = (squareIndex: number) => {
    const squareAssetId = plotSquares[squareIndex];
    const plant = squareAssetId ? plants[squareAssetId] : null;
    const decoration = squareAssetId ? placedDecorations[squareAssetId] : null;
    const isSelected = selectedSquare === squareIndex;

    let squareClass = "card small flex items-center justify-center";
    if (!isReadOnly && !isUpdatingPlot) {
      squareClass += " cursor-pointer";
      if (isSelected) squareClass += " success";
    }

    const isReserved = plotConfig.reservedSquares?.includes(squareIndex);
    const emptySquareContent = isReadOnly ? (
      "Empty"
    ) : isReserved ? (
      <img
        className="m-auto"
        src="https://sdk-style.s3.amazonaws.com/icons/star.svg"
        style={{ width: "12px", opacity: 0.7 }}
      />
    ) : (
      <img
        className="m-auto"
        src="https://sdk-style.s3.amazonaws.com/icons/add.svg"
        style={{ width: "8px", opacity: 0.5 }}
      />
    );

    return (
      <div
        key={squareIndex}
        className={squareClass}
        style={{ minHeight: "70px" }}
        onClick={() => handleSquareClick(squareIndex)}
      >
        <div className="card-details text-center">
          {plant ? (
            <div>
              <img className="m-auto" src={seeds[plant.seedId].icon} />
              <p className="p4 text-muted">
                Lv {plant.growLevel}/{seeds[plant.seedId]?.harvestLevel || 10}
              </p>
              {plant.growLevel >= (seeds[plant.seedId]?.harvestLevel || 10) && (
                <p className="p4 text-success">Ready!</p>
              )}
            </div>
          ) : decoration ? (
            <img className="m-auto" src={decorations[decoration.id].icon} />
          ) : (
            <div>{emptySquareContent}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {Array.from({ length: plotConfig.gridCols * plotConfig.gridRows }, (_, i) => renderSquare(i))}
      </div>

      {!isReadOnly && selectedSquare !== null && !plotSquares[selectedSquare] && (
        <>
          {plotConfig.reservedSquares?.includes(selectedSquare) ? (
            <PlaceDecoration
              selectedSquare={selectedSquare}
              setSelectedSquare={setSelectedSquare}
              setIsUpdatingPlot={setIsUpdatingPlot}
              decorationsOwned={visitorData?.decorationsOwned || {}}
            />
          ) : (
            <PlantSeed
              selectedSquare={selectedSquare}
              setSelectedSquare={setSelectedSquare}
              setIsUpdatingPlot={setIsUpdatingPlot}
              seedsPurchased={visitorData?.seedsPurchased || {}}
            />
          )}
        </>
      )}

      {showRemovePlantModal && (
        <ConfirmationModal
          title="Remove Plant?"
          message="Removing this plant will free up this plot square."
          handleToggleShowConfirmationModal={handleCancelRemove}
          handleOnConfirm={() => handleClearSquare({ type: "plant" })}
        />
      )}

      {showRemoveDecorationModal && (
        <ConfirmationModal
          title="Remove Decoration?"
          message="Removing this decoration will return it to your inventory so you can place it again later."
          handleToggleShowConfirmationModal={handleCancelRemove}
          handleOnConfirm={() => handleClearSquare({ type: "decoration" })}
        />
      )}
    </div>
  );
};

export default PlotGrid;
