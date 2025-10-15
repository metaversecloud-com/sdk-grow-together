import { useContext, useState } from "react";

// components
import { ConfirmationModal } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const AdminView = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { plotAssetData } = useContext(GlobalStateContext);

  const [showClearPlotModal, setShowClearPlotModal] = useState(false);
  const [showClearAllPlotsModal, setShowClearAllPlotsModal] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const handleToggleShowClearPlotModal = () => {
    setShowClearPlotModal(!showClearPlotModal);
  };

  const handleToggleShowClearAllPlotsModal = () => {
    setShowClearAllPlotsModal(!showClearAllPlotsModal);
  };

  const handleClearThisPlot = async () => {
    setAreButtonsDisabled(true);

    backendAPI
      .post("/admin/clear-plot")
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  const handleClearAllPlots = async () => {
    setAreButtonsDisabled(true);

    backendAPI
      .post("/admin/clear-all-plots")
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  return (
    <div>
      {plotAssetData?.ownerId && (
        <div className="grid gap-2 mb-10">
          <h4>Clear This Plot</h4>
          <p>
            Removes the garden owner and completely clears this plot's game progress. A new player will be able to claim
            this plot.
          </p>
          <button
            className="btn btn-danger-outline mt-4"
            onClick={handleToggleShowClearPlotModal}
            disabled={areButtonsDisabled}
          >
            Clear This Plot
          </button>
        </div>
      )}

      <div className="grid gap-2 mb-10">
        <h4>Clear All Plots</h4>
        <p>
          WARNING: This setting will completely clear game progress for all plots in this world and all garden owners
          will have to claim a new plot.
        </p>
        <button
          className="btn btn-danger mt-4"
          onClick={handleToggleShowClearAllPlotsModal}
          disabled={areButtonsDisabled}
        >
          Clear All Plots
        </button>
      </div>

      {showClearPlotModal && (
        <ConfirmationModal
          title="Clear This Plot"
          message="Are you sure you want to clear this plot? This action cannot be undone."
          handleOnConfirm={handleClearThisPlot}
          handleToggleShowConfirmationModal={handleToggleShowClearPlotModal}
        />
      )}

      {showClearAllPlotsModal && (
        <ConfirmationModal
          title="Clear All Plots"
          message="Are you sure you want to clear all plots? This action cannot be undone."
          handleOnConfirm={handleClearAllPlots}
          handleToggleShowConfirmationModal={handleToggleShowClearAllPlotsModal}
        />
      )}
    </div>
  );
};

export default AdminView;
