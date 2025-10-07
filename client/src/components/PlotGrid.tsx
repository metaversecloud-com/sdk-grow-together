import { useContext, useState } from "react";

// components
import { RemoveModal, PlaceDecoration, PlantSeed } from "@/components";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA, SET_VISITOR_PLOT_DATA } from "@/context/types";

// types
import { decorations, plotConfig, seeds, VisitorDataObjectType, VisitorWorldDataType } from "@shared/index.js";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

interface PlotGridProps {
  plotSquares: { [key: number]: string | null };
  crops: VisitorWorldDataType["crops"];
  placedDecorations: VisitorWorldDataType["decorations"];
  isReadOnly: boolean;
  visitorData?: VisitorDataObjectType;
}

export const PlotGrid = ({ plotSquares, crops, placedDecorations, isReadOnly, visitorData }: PlotGridProps) => {
  const dispatch = useContext(GlobalDispatchContext);

  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [isUpdatingPlot, setIsUpdatingPlot] = useState(false);
  const [showRemoveCropModal, setShowRemoveCropModal] = useState(false);
  const [showRemoveDecorationModal, setShowRemoveDecorationModal] = useState(false);

  const handleSquareClick = (squareId: number) => {
    if (isReadOnly) return;

    setSelectedSquare(selectedSquare === squareId ? null : squareId);

    if (plotSquares[squareId] && crops[plotSquares[squareId]]) setShowRemoveCropModal(true);
    else if (plotSquares[squareId] && placedDecorations[plotSquares[squareId]]) setShowRemoveDecorationModal(true);
  };

  const handleCancelRemove = () => {
    setShowRemoveCropModal(false);
    setShowRemoveDecorationModal(false);
    setSelectedSquare(null);
  };

  const handleViewSquare = async ({ type }: { type: "crop" | "decoration" }) => {
    await backendAPI
      .post(`/square/view`, {
        squareId: selectedSquare,
        type,
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      });
  };

  const handleClearSquare = async ({ type }: { type: "crop" | "decoration" }) => {
    await backendAPI
      .post(`/${type}/remove`, {
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
        setShowRemoveCropModal(false);
        setShowRemoveDecorationModal(false);
      });
  };

  const renderSquare = (squareId: number) => {
    const squareAssetId = plotSquares[squareId];
    const crop = squareAssetId ? crops[squareAssetId] : null;
    const decoration = squareAssetId ? placedDecorations[squareAssetId] : null;
    const isSelected = selectedSquare === squareId;
    const isReserved = plotConfig.reservedSquares?.includes(squareId);

    let squareClass = "card small flex items-center justify-center";
    if (!isReadOnly && !isUpdatingPlot) {
      squareClass += " cursor-pointer";
      if (isSelected) squareClass += " success";
    }
    if (isReserved) squareClass += " decoration";
    else squareClass += " crop";

    const emptySquareContent = isReadOnly ? (
      "Empty"
    ) : (
      <img className="m-auto" src="https://sdk-style.s3.amazonaws.com/icons/add.svg" />
    );

    return (
      <div
        key={squareId}
        className={squareClass}
        style={{ minHeight: "70px" }}
        onClick={() => handleSquareClick(squareId)}
      >
        <div className="card-details text-center">
          {crop ? (
            <div>
              <img className="m-auto" src={seeds[crop.seedId].icon} />
              <p className="p3">
                lvl {crop.growLevel}/{seeds[crop.seedId]?.harvestLevel || 10}
              </p>
              {crop.growLevel >= (seeds[crop.seedId]?.harvestLevel || 10) && <p className="p4 text-success">Ready!</p>}
            </div>
          ) : decoration ? (
            <img className="m-auto" src={decorations[decoration.decorationId]?.icon} />
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
        {Array.from({ length: plotConfig.gridCols * plotConfig.gridRows }, (_, i) => renderSquare(i + 1))}
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

      {showRemoveCropModal && (
        <RemoveModal
          title="Remove Crop?"
          message="Removing this crop will free up this plot square."
          handleCancelRemove={handleCancelRemove}
          handleViewSquare={() => handleViewSquare({ type: "crop" })}
          handleOnConfirm={() => handleClearSquare({ type: "crop" })}
        />
      )}

      {showRemoveDecorationModal && (
        <RemoveModal
          title="Remove Decoration?"
          message="Removing this decoration will return it to your inventory so you can place it again later."
          handleCancelRemove={handleCancelRemove}
          handleViewSquare={() => handleViewSquare({ type: "decoration" })}
          handleOnConfirm={() => handleClearSquare({ type: "decoration" })}
        />
      )}
    </div>
  );
};

export default PlotGrid;
