import { SelectedSquareDetails } from "@/context/types";

type PlotSquareType = "crop" | "decoration";

interface PlotSquareProps {
  squareId: number;
  itemType?: PlotSquareType;
  squareDetails: SelectedSquareDetails;
  isOwnedByCurrentUser?: boolean;
  handleSquareClick: () => void;
}

export const PlotSquare = ({
  squareId,
  itemType,
  squareDetails,
  isOwnedByCurrentUser,
  handleSquareClick,
}: PlotSquareProps) => {
  const { isEmpty, icon, growLevel, harvestLevel, isReadyToWater, isReadyToHarvest } = squareDetails;

  if (isEmpty && !isOwnedByCurrentUser) {
    return (
      <div
        key={squareId}
        className={`card small flex items-center justify-center ${itemType} readonly`}
        style={{ height: "75px", width: "75px", border: "1px solid #000" }}
      ></div>
    );
  }

  return (
    <div
      key={squareId}
      className={`card small flex items-center justify-center cursor-pointer  ${itemType}`}
      style={{ height: "75px", width: "75px", border: "1px solid #000" }}
      onClick={() => handleSquareClick()}
    >
      <div className="card-details text-center">
        {isEmpty ? (
          <img className="m-auto" src="https://sdk-style.s3.amazonaws.com/icons/add.svg" />
        ) : itemType === "crop" ? (
          <>
            <img className="m-auto" src={icon} style={{ maxHeight: "35px" }} />
            <p className="p3">
              lvl {growLevel}/{harvestLevel}
            </p>
            {isReadyToWater && <p className="p4 text-success">Water!</p>}
            {isReadyToHarvest && <p className="p4">Harvest!</p>}
          </>
        ) : (
          <img className="m-auto" src={icon} />
        )}
      </div>
    </div>
  );
};

export default PlotSquare;
