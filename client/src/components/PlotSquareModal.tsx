import { useContext, useState } from "react";

// components
import { ModalHeader, HarvestButton, WaterButton, UseToolModal, AppliedToolIcons } from "@/components";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SelectedSquareDetails } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

interface PlotSquareModalProps {
  selectedSquareId: number;
  itemAssetId: string;
  itemType: "crop" | "decoration";
  selectedSquareDetails: SelectedSquareDetails;
  isOwnedByCurrentUser?: boolean;
  ownerId?: string;
  closeSquareModal: () => void;
}

export const PlotSquareModal = ({
  selectedSquareId,
  itemAssetId,
  itemType,
  selectedSquareDetails,
  isOwnedByCurrentUser,
  ownerId,
  closeSquareModal,
}: PlotSquareModalProps) => {
  const dispatch = useContext(GlobalDispatchContext);

  const { title, icon, growLevel, harvestLevel, reward, isReadyToWater, isReadyToHarvest, appliedTools } =
    selectedSquareDetails;

  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);

  const handleViewSquare = async () => {
    setAreButtonsDisabled(true);
    await backendAPI
      .post(`/square/view`, {
        itemAssetId,
        type: itemType,
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  const handleClearSquare = async () => {
    setAreButtonsDisabled(true);
    await backendAPI
      .post(`/${itemType}/remove`, {
        squareId: selectedSquareId,
      })
      .then((response) => {
        setGameState(dispatch, response.data);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        closeSquareModal();
      });
  };

  return (
    <>
      <div className="modal-container">
        <div className="modal">
          <ModalHeader
            text={title || ""}
            disabled={areButtonsDisabled}
            handleOnClick={() => {
              closeSquareModal();
            }}
          />
          <div className="card menu-card m-auto" style={{ height: "95px", width: "95px", position: "relative" }}>
            <div style={{ position: "absolute", top: "0px", left: "-35px" }}>
              <AppliedToolIcons appliedTools={appliedTools} />
            </div>
            {itemType === "crop" ? (
              <div className="m-auto">
                <img className="m-auto" src={icon} style={{ maxHeight: "35px" }} />
                <p className="p3">
                  lvl {growLevel}/{harvestLevel || 10}
                </p>
                {isReadyToWater && <p className="p4 water">Water!</p>}
                {isReadyToHarvest && <p className="p4">Harvest!</p>}
              </div>
            ) : (
              <img className="m-auto" src={icon} style={{ maxHeight: "35px" }} />
            )}
          </div>

          {/* Action Buttons */}
          {itemType === "crop" &&
            ((!isOwnedByCurrentUser && isReadyToWater) || !isReadyToWater) &&
            !isReadyToHarvest && (
              <button
                id="useTool"
                className="btn btn-outline tool"
                onClick={() => setShowToolModal(true)}
                disabled={areButtonsDisabled}
              >
                Use Tool
              </button>
            )}

          {isOwnedByCurrentUser && isReadyToWater && (
            <WaterButton
              cropAssetId={itemAssetId}
              handleAfterWater={closeSquareModal}
              setAreButtonsDisabled={setAreButtonsDisabled}
            />
          )}

          {isOwnedByCurrentUser && isReadyToHarvest && (
            <HarvestButton
              cropAssetId={itemAssetId}
              handleAfterHarvest={closeSquareModal}
              reward={reward || 0}
              setAreButtonsDisabled={setAreButtonsDisabled}
            />
          )}

          <div className="actions">
            <button
              id="viewSquare"
              className="btn btn-outline"
              onClick={() => handleViewSquare()}
              disabled={areButtonsDisabled}
            >
              View Slot
            </button>
            {isOwnedByCurrentUser && (
              <button
                className="btn btn-danger-outline"
                onClick={() => handleClearSquare()}
                disabled={areButtonsDisabled}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Tool Modal */}
      {showToolModal && (
        <UseToolModal
          itemAssetId={itemAssetId}
          selectedSquareId={selectedSquareId}
          ownerId={ownerId}
          isOwnedByCurrentUser={isOwnedByCurrentUser}
          isReadyToWater={isReadyToWater}
          appliedTools={appliedTools || []}
          closeToolModal={() => setShowToolModal(false)}
          closeSquareModal={closeSquareModal}
        />
      )}
    </>
  );
};

export default PlotSquareModal;
