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
  const [showClearInactivePlotsModal, setShowClearInactivePlotsModal] = useState(false);
  const [showClearAllPlotsModal, setShowClearAllPlotsModal] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const handleToggleShowClearPlotModal = () => {
    setShowClearPlotModal(!showClearPlotModal);
  };

  const handleToggleShowClearInactivePlotsModal = () => {
    setShowClearInactivePlotsModal(!showClearInactivePlotsModal);
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

  const handleClearInactivePlots = async () => {
    setAreButtonsDisabled(true);

    backendAPI
      .post("/admin/clear-all-plots", { clearInactiveOnly: true })
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
            className="btn btn-danger-outline"
            onClick={handleToggleShowClearPlotModal}
            disabled={areButtonsDisabled}
          >
            Clear This Plot
          </button>
        </div>
      )}

      <div className="grid gap-2 mb-10">
        <h4>Clear Inactive Plots</h4>
        <p>
          Clears game progress for all plots in this world with no activity in the last 2 weeks. Garden owners who lose
          their plot can claim a new one.
        </p>
        <button
          className="btn btn-danger-outline"
          onClick={handleToggleShowClearInactivePlotsModal}
          disabled={areButtonsDisabled}
        >
          Clear Inactive Plots
        </button>
      </div>

      <div className="grid gap-2 mb-10">
        <h4>Clear All Plots</h4>
        <p>
          WARNING: This setting will completely clear game progress for all plots in this world and all garden owners
          will have to claim a new plot.
        </p>
        <button className="btn btn-danger" onClick={handleToggleShowClearAllPlotsModal} disabled={areButtonsDisabled}>
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

      {showClearInactivePlotsModal && (
        <ConfirmationModal
          title="Clear Inactive Plots"
          message="Are you sure you want to clear all inactive plots? This action cannot be undone."
          handleOnConfirm={handleClearInactivePlots}
          handleToggleShowConfirmationModal={handleToggleShowClearInactivePlotsModal}
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
