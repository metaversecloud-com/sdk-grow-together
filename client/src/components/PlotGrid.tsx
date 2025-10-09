import { useContext, useState } from "react";

// components
import { PlaceDecoration, PlantSeed, ModalHeader } from "@/components";

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
  const [showSquareModal, setShowSquareModal] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const handleSquareClick = (squareId: number) => {
    if (isReadOnly) return;

    setSelectedSquare(selectedSquare === squareId ? null : squareId);

    if (plotSquares[squareId]) setShowSquareModal(true);
  };

  const handleCancelRemove = () => {
    setShowSquareModal(false);
    setSelectedSquare(null);
  };

  const handleViewSquare = async ({ type }: { type: "crop" | "decoration" }) => {
    setAreButtonsDisabled(true);
    await backendAPI
      .post(`/square/view`, {
        squareId: selectedSquare,
        type,
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  const handleClearSquare = async ({ type }: { type: "crop" | "decoration" }) => {
    setAreButtonsDisabled(true);
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
        setShowSquareModal(false);
        setAreButtonsDisabled(false);
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

  const renderSquareModal = () => {
    const squareAssetId = plotSquares[selectedSquare!];
    const crop = squareAssetId ? crops[squareAssetId] : null;
    const decoration = squareAssetId ? placedDecorations[squareAssetId] : null;

    let title: string = `Slot ${selectedSquare!}`;
    let icon: string | undefined;
    let name: string | undefined;
    let harvestLevel: number | undefined;
    let type: "crop" | "decoration";

    if (crop) {
      name = seeds[crop.seedId].name;
      title = `${name} in Slot ${selectedSquare!}`;
      icon = seeds[crop.seedId].icon;
      harvestLevel = seeds[crop.seedId]?.harvestLevel || 10;
      type = "crop";
    } else if (decoration) {
      name = decorations[decoration.decorationId]?.name;
      title = `${name} in Slot ${selectedSquare!}`;
      icon = decorations[decoration.decorationId]?.icon;
      type = "decoration";
    }

    return (
      <div className="modal-container">
        <div className="modal">
          <ModalHeader
            text={title}
            disabled={areButtonsDisabled}
            handleOnClick={() => {
              handleCancelRemove();
            }}
          />
          <div className="card m-auto" style={{ width: "auto" }}>
            {crop ? (
              <div>
                <img className="m-auto" src={icon} />
                <p className="p3">
                  lvl {crop.growLevel}/{harvestLevel || 10}
                </p>
                {crop.growLevel >= (harvestLevel || 10) && <p className="p4 text-success">Ready!</p>}
              </div>
            ) : decoration ? (
              <img className="m-auto" src={icon} />
            ) : null}
          </div>
          <div className="actions">
            <button
              id="viewSquare"
              className="btn btn-outline"
              onClick={() => handleViewSquare({ type })}
              disabled={areButtonsDisabled}
            >
              View Slot
            </button>
            <button
              className="btn btn-danger-outline"
              onClick={() => handleClearSquare({ type })}
              disabled={areButtonsDisabled}
            >
              Remove
            </button>
          </div>
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

      {showSquareModal && selectedSquare !== null && renderSquareModal()}
    </div>
  );
};

export default PlotGrid;
