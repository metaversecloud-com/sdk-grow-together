import { useContext, useState } from "react";

// components
import { ModalHeader, HarvestButton, WaterButton, UseToolModal } from "@/components";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import {
  ErrorType,
  SelectedSquareDetails,
  SET_VISITOR_DATA,
  SET_VISITOR_INVENTORY,
  SET_VISITOR_PLOT_DATA,
} from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

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

  const { title, icon, growLevel, harvestLevel, reward, isReadyToWater, isReadyToHarvest } = selectedSquareDetails;

  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);

  const handleViewSquare = async () => {
    setAreButtonsDisabled(true);
    await backendAPI
      .post(`/square/view`, {
        squareId: selectedSquareId,
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
        const { visitorInventory, visitorData, visitorPlotData } = response.data;
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory, error: "" },
        });
        dispatch!({
          type: SET_VISITOR_DATA,
          payload: { visitorData, error: "" },
        });
        dispatch!({
          type: SET_VISITOR_PLOT_DATA,
          payload: { visitorPlotData, error: "" },
        });
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        closeSquareModal();
      });
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={title || ""}
          disabled={areButtonsDisabled}
          handleOnClick={() => {
            closeSquareModal();
          }}
        />
        <div className="card menu-card m-auto" style={{ height: "95px", width: "95px" }}>
          {itemType === "crop" ? (
            <div>
              <img className="m-auto" src={icon} />
              <p className="p3">
                lvl {growLevel}/{harvestLevel || 10}
              </p>
              {isReadyToWater && <p className="p4 water">Water!</p>}
              {isReadyToHarvest && <p className="p4">Harvest!</p>}
            </div>
          ) : (
            <img className="m-auto" src={icon} />
          )}
        </div>

        {/* Actions */}
        {/* {itemType === "crop" && !isReadyToWater && !isReadyToHarvest && ( */}
        {itemType === "crop" && (
          <button
            id="useTool"
            className="btn btn-outline"
            onClick={() => setShowToolModal(true)}
            disabled={areButtonsDisabled}
          >
            Use Tool
          </button>
        )}

        {isReadyToWater && (
          <WaterButton
            cropAssetId={itemAssetId}
            handleAfterWater={closeSquareModal}
            setAreButtonsDisabled={setAreButtonsDisabled}
          />
        )}
        {isReadyToHarvest && (
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

        {/* Tool Modal */}
        {showToolModal && (
          <UseToolModal
            itemAssetId={itemAssetId}
            selectedSquareId={selectedSquareId}
            ownerId={ownerId}
            closeToolModal={() => setShowToolModal(false)}
            closeSquareModal={closeSquareModal}
          />
        )}
      </div>
    </div>
  );
};

export default PlotSquareModal;
