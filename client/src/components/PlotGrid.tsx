import { useState } from "react";

// components
import { PlaceDecoration, PlantSeed } from "@/components";

// types
import { plotConfig, seeds, VisitorDataObjectType, VisitorWorldDataType } from "@shared/index.js";

interface PlotGridProps {
  plotSquares: { [key: number]: string | null };
  plants: VisitorWorldDataType["plants"];
  isReadOnly: boolean;
  visitorData?: VisitorDataObjectType;
}

export const PlotGrid = ({ plotSquares, plants, isReadOnly, visitorData }: PlotGridProps) => {
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [isUpdatingPlot, setIsUpdatingPlot] = useState(false);

  const handleSquareClick = (squareIndex: number) => {
    if (isReadOnly || plotSquares[squareIndex]) return;
    setSelectedSquare(selectedSquare === squareIndex ? null : squareIndex);
  };

  const renderSquare = (squareIndex: number) => {
    const plantAssetId = plotSquares[squareIndex];
    const plant = plantAssetId ? plants[plantAssetId] : null;
    const isEmpty = !plantAssetId;
    const isSelected = selectedSquare === squareIndex;

    let squareClass = "card small flex items-center justify-center";
    if (isEmpty && !isReadOnly && !isUpdatingPlot) {
      squareClass += " cursor-pointer";
      if (isSelected) squareClass += " success";
    }
    if (plant?.wasHarvested) {
      squareClass += " opacity-50";
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
          {plant && !plant.wasHarvested ? (
            <div>
              <img className="m-auto" src={seeds[plant.seedId].icon} />
              <p className="p4 text-muted">
                Lv {plant.growLevel}/{seeds[plant.seedId]?.harvestLevel || 10}
              </p>
              {plant.growLevel >= (seeds[plant.seedId]?.harvestLevel || 10) && (
                <p className="p4 text-success">Ready!</p>
              )}
            </div>
          ) : plant && plant.wasHarvested ? (
            <p className="p4 text-muted">Harvested</p>
          ) : (
            <div>{emptySquareContent}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-col">
      <h3 className="h3 text-center py-4">Garden Plot (4x4)</h3>

      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {Array.from({ length: plotConfig.gridCols * plotConfig.gridRows }, (_, i) => renderSquare(i))}
      </div>

      {!isReadOnly &&
        selectedSquare !== null &&
        (plotConfig.reservedSquares?.includes(selectedSquare) ? (
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
        ))}
    </div>
  );
};

export default PlotGrid;
