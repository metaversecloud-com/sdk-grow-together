import { useContext, useState } from "react";

// components
import { PlaceDecoration, PlantSeed, PlotSquare, PlotSquareModal, UsePlotToolModal } from "@/components";

// context
import { GlobalStateContext } from "@/context/GlobalContext";
import { SelectedSquareDetails } from "@/context/types";

// types
import {
  EcosystemInventoryItemType,
  getSecondsRemaining,
  plotConfig,
  VisitorInventoryType,
  VisitorWorldDataType,
} from "@shared/index.js";

// utils

interface PlotGridProps {
  plotSquares: { [key: number]: string | null };
  crops: VisitorWorldDataType["crops"];
  placedDecorations: VisitorWorldDataType["decorations"];
  visitorInventory?: VisitorInventoryType;
  isOwnedByCurrentUser?: boolean;
  ownerId?: string;
}

type PlotSquareType = "crop" | "decoration";

export const PlotGrid = ({ plotSquares, crops, placedDecorations, isOwnedByCurrentUser, ownerId }: PlotGridProps) => {
  const { decorations = {}, seeds = {}, tools = {} } = useContext(GlobalStateContext);

  const sprinklerIcon = Object.values(tools).find(
    (item: EcosystemInventoryItemType) => item.name === "Basic Sprinkler",
  )?.icon;
  const harvestIcon = Object.values(tools).find(
    (item: EcosystemInventoryItemType) => item.name === "Basic Harvest Basket",
  )?.icon;

  const [selectedSquareId, setSelectedSquareId] = useState<number | null>(null);
  const [selectedSquareType, setSelectedSquareIdType] = useState<PlotSquareType>("crop");
  const [noOfCropsReadyToWater, setNoOfCropsReadyToWater] = useState<number>(0);
  const [noOfCropsReadyToHarvest, setNoOfCropsReadyToHarvest] = useState<number>(0);
  const [selectedSquareDetails, setSelectedSquareDetails] = useState<SelectedSquareDetails>({ title: "" });
  const [showSquareModal, setShowSquareModal] = useState(false);
  const [showUsePlotToolModal, setShowUsePlotToolModal] = useState(false);
  const [actionType, setActionType] = useState<"Water" | "Harvest" | null>(null);

  const handleSquareClick = (squareId: number, itemType: PlotSquareType) => {
    setSelectedSquareId(squareId);
    setSelectedSquareIdType(itemType);
    setSelectedSquareDetails(getSquareDetails(squareId));

    if (plotSquares[squareId]) setShowSquareModal(true);
  };

  const getSquareDetails = (squareId: number) => {
    const squareAssetId = plotSquares[squareId];
    if (!squareAssetId) return { isEmpty: true, title: `Slot ${squareId}` };

    const crop = squareAssetId ? crops[squareAssetId] : null;
    const decoration = squareAssetId ? placedDecorations[squareAssetId] : null;

    let title, icon, name, growLevel, harvestLevel, reward, isReadyToWater, isReadyToHarvest, appliedTools;

    if (crop) {
      name = seeds[crop.seedId].name;
      title = `${name} in Slot ${squareId!}`;
      icon = seeds[crop.seedId].icon;
      growLevel = crop.growLevel;
      harvestLevel = seeds[crop.seedId].harvestLevel || 10;
      reward = seeds[crop.seedId].reward;
      appliedTools = crop.appliedTools || [];

      if (growLevel >= harvestLevel) {
        isReadyToHarvest = true;
      } else if (crop.lastWatered && !isReadyToWater) {
        const remainingSeconds = getSecondsRemaining(
          crop.lastWatered,
          seeds[crop.seedId].growthTime,
          crop.appliedTools || [],
        );
        if (remainingSeconds <= 0) {
          isReadyToWater = true;
        }
      }
    } else if (decoration) {
      name = decorations[decoration.decorationId]?.name;
      title = `${name} in Slot ${squareId!}`;
      icon = decorations[decoration.decorationId]?.icon;
    }

    return { title, icon, name, growLevel, harvestLevel, reward, isReadyToWater, isReadyToHarvest, appliedTools };
  };

  const handleShowUsePlotToolModal = (actionType: "Water" | "Harvest") => {
    let noOfCropsReadyToWater = 0;
    let noOfCropsReadyToHarvest = 0;

    for (const crop in crops) {
      const { seedId, growLevel, lastWatered, appliedTools } = crops[crop];
      const harvestLevel = seeds[seedId].harvestLevel || 10;

      if (growLevel >= harvestLevel) {
        noOfCropsReadyToHarvest += 1;
      } else if (lastWatered) {
        const remainingSeconds = getSecondsRemaining(lastWatered, seeds[seedId].growthTime, appliedTools || []);
        if (remainingSeconds <= 0) {
          noOfCropsReadyToWater += 1;
        }
      }
    }

    setNoOfCropsReadyToWater(noOfCropsReadyToWater);
    setNoOfCropsReadyToHarvest(noOfCropsReadyToHarvest);
    setActionType(actionType);
    setShowUsePlotToolModal(true);
  };

  const closeSquareModal = () => {
    setShowSquareModal(false);
    setSelectedSquareId(null);
  };

  return (
    <div>
      {isOwnedByCurrentUser && (
        <div className="flex pt-6">
          <h4 className="pr-4 pt-2">Garden Plot</h4>
          <div className="btn btn-icon btn-icon-sm mr-2" onClick={() => handleShowUsePlotToolModal("Water")}>
            {sprinklerIcon ? <img src={sprinklerIcon} alt="Basic Sprinkler" /> : "💦"}
          </div>
          <div className="btn btn-icon btn-icon-sm mr-2" onClick={() => handleShowUsePlotToolModal("Harvest")}>
            {harvestIcon ? <img src={harvestIcon} alt="Basic Harvest Basket" /> : "🧺"}
          </div>
        </div>
      )}

      {/* Decorations Grid */}
      {isOwnedByCurrentUser && (
        <div className="mb-4">
          <h6 className="pb-1">Decorations</h6>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {plotConfig.reservedSquares.map((squareId) => (
              <PlotSquare
                key={squareId}
                squareId={squareId}
                itemType="decoration"
                squareDetails={getSquareDetails(squareId)}
                isOwnedByCurrentUser={isOwnedByCurrentUser}
                handleSquareClick={() => handleSquareClick(squareId, "decoration")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Crops Grid */}
      <div className="mb-4">
        <h6 className="pb-1">Crops</h6>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {Array.from(
            { length: plotConfig.gridCols * plotConfig.gridRows - plotConfig.reservedSquares.length },
            (_, i) => {
              const squareId = i + 1 + plotConfig.reservedSquares.length;
              return (
                <PlotSquare
                  key={squareId}
                  squareId={squareId}
                  itemType="crop"
                  squareDetails={getSquareDetails(squareId)}
                  isOwnedByCurrentUser={isOwnedByCurrentUser}
                  handleSquareClick={() => handleSquareClick(squareId, "crop")}
                />
              );
            },
          )}
        </div>
      </div>

      {selectedSquareId !== null && !plotSquares[selectedSquareId] && (
        <>
          {plotConfig.reservedSquares?.includes(selectedSquareId) ? (
            <PlaceDecoration selectedSquareId={selectedSquareId} setSelectedSquareId={setSelectedSquareId} />
          ) : (
            <PlantSeed selectedSquareId={selectedSquareId} setSelectedSquareId={setSelectedSquareId} />
          )}
        </>
      )}

      {showSquareModal && selectedSquareId !== null && plotSquares[selectedSquareId] && (
        <PlotSquareModal
          selectedSquareId={selectedSquareId}
          itemAssetId={plotSquares[selectedSquareId]!}
          itemType={selectedSquareType}
          selectedSquareDetails={selectedSquareDetails}
          isOwnedByCurrentUser={isOwnedByCurrentUser}
          ownerId={ownerId}
          closeSquareModal={closeSquareModal}
        />
      )}

      {showUsePlotToolModal && actionType && (
        <UsePlotToolModal
          actionType={actionType}
          numberOfCropsReady={actionType === "Water" ? noOfCropsReadyToWater : noOfCropsReadyToHarvest}
          closeToolModal={() => setShowUsePlotToolModal(false)}
        />
      )}
    </div>
  );
};

export default PlotGrid;
