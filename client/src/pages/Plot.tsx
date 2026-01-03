import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { GetStartedModal, InventoryModal, PageContainer, PlotGrid, UsePlotToolModal, YourMoney } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { s3URL } from "@shared/constants";

export const Plot = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const {
    hasInteractiveParams,
    plotAssetData,
    visitorInventory = { coins: 0 },
    visitorPlotData,
  } = useContext(GlobalStateContext);
  const { claimedDate, ownerId, ownerName } = plotAssetData || {};
  const { plotAssetId, plotSquares, crops, decorations } = visitorPlotData || { plotSquares: {} };
  const { coins } = visitorInventory;

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showVisitorInventoryOnly, setShowVisitorInventoryOnly] = useState(false);
  const [showGetStartedModal, setShowGetStartedModal] = useState(searchParams.get("isFirstTimeOpen") === "true");
  const [showWaterPlotModal, setShowWaterPlotModal] = useState(false);
  const [showHarvestPlotModal, setShowHarvestPlotModal] = useState(false);

  const profileId = searchParams.get("profileId");

  const isOwnedByCurrentUser = profileId === ownerId;
  const isOwnedByOtherUser = ownerId && ownerId !== profileId;

  let headerText = "Open Garden";
  if (isOwnedByOtherUser) {
    headerText = `${ownerName}'s Garden`;
  } else if (plotAssetId && isOwnedByCurrentUser) {
    headerText = "Your Garden";
  }

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/game-state")
        .then((response) => {
          setGameState(dispatch, response.data);
        })
        .catch((error) => setErrorMessage(dispatch, error as ErrorType))
        .finally(() => setIsLoading(false));
    }
  }, [hasInteractiveParams]);

  const handleClaimPlot = async () => {
    setIsClaiming(true);
    await backendAPI
      .post("/plot/claim")
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => setIsClaiming(false));
  };

  const handleTeleportToPlot = async () => {
    setIsLoading(true);
    await backendAPI
      .post("/plot/teleport")
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => setIsLoading(false));
  };

  return (
    <PageContainer isLoading={isLoading} headerText={headerText} showInfoIcon={isOwnedByCurrentUser}>
      <div className="container">
        {/* Current user's plot */}
        {isOwnedByCurrentUser && plotAssetId && (
          <div className="grid gap-2">
            <YourMoney coinsAvailable={coins || 0} />

            <div className="grid gap-2 grid-cols-2">
              <button
                className="btn btn-outline p2 crop"
                onClick={() => {
                  setShowInventoryModal(true);
                  setShowVisitorInventoryOnly(false);
                }}
              >
                View Store
              </button>
              <button
                className="btn btn-outline p2 decoration"
                onClick={() => {
                  setShowInventoryModal(true);
                  setShowVisitorInventoryOnly(true);
                }}
              >
                View Backpack
              </button>
            </div>
            <div className="flex py-6">
              <h4 className="pr-4 pt-2">Garden Plot</h4>
              <button className="btn btn-icon mr-2" onClick={() => setShowWaterPlotModal(!showWaterPlotModal)}>
                💦
              </button>
              <button className="btn btn-icon mr-2" onClick={() => setShowHarvestPlotModal(!showHarvestPlotModal)}>
                🧺
              </button>
            </div>
            <PlotGrid
              plotSquares={plotSquares}
              crops={crops || {}}
              placedDecorations={decorations || {}}
              isOwnedByCurrentUser={isOwnedByCurrentUser}
              ownerId={ownerId}
            />
          </div>
        )}

        {/* Plot owned by another user */}
        {isOwnedByOtherUser && (
          <div className="grid gap-2 mb-10">
            {claimedDate && <p>Garden Started: {new Date(claimedDate).toLocaleDateString()}</p>}
            <PlotGrid
              plotSquares={plotSquares}
              crops={crops || {}}
              placedDecorations={decorations || {}}
              ownerId={ownerId}
            />
          </div>
        )}

        {/* Current user doesn't own any plot - show claim option */}
        {!isOwnedByOtherUser && !plotAssetId && (
          <div className="grid gap-2 mb-10">
            <img
              src={`${s3URL}/OpenGarden.png`}
              alt="Open Garden"
              className="mx-auto mb-4"
              style={{ height: "320px" }}
            />
            <button className="btn" onClick={handleClaimPlot} disabled={isClaiming}>
              {isClaiming ? "Claiming..." : "Start Your Garden"}
            </button>
            <h3 className="pt-4">About Grow Together</h3>
            <p>
              Grow plants and add decorations to your very own garden. Water and harvest plants to earn coins and
              purchase rare seeds and decorations in the Garden Store.
            </p>
          </div>
        )}

        {/* Current user already owns a different plot */}
        {plotAssetId && !isOwnedByCurrentUser && (
          <div className="grid gap-2 mb-10">
            <h4>Are you looking for your garden?</h4>
            <p>Click the button below to teleport to it.</p>
            <button className="btn mt-4" onClick={() => handleTeleportToPlot()}>
              Teleport to My Garden
            </button>
          </div>
        )}

        {/* Plot available and current user already owns a different plot */}
        {!isOwnedByOtherUser && plotAssetId && !isOwnedByCurrentUser && (
          <div className="grid gap-2">
            <h4>Do you know someone who needs a garden?</h4>
            <p>Let them know about this place! You can send them a direct message if you're already friends.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInventoryModal && (
        <InventoryModal
          showVisitorInventoryOnly={showVisitorInventoryOnly}
          onClose={() => setShowInventoryModal(false)}
        />
      )}
      {showGetStartedModal && (
        <GetStartedModal setShowGetStartedModal={() => setShowGetStartedModal(!showGetStartedModal)} />
      )}
      {showWaterPlotModal && (
        <UsePlotToolModal actionType="Water" ownerId={ownerId} closeToolModal={() => setShowWaterPlotModal(false)} />
      )}
      {showHarvestPlotModal && (
        <UsePlotToolModal
          actionType="Harvest"
          ownerId={ownerId}
          closeToolModal={() => setShowHarvestPlotModal(false)}
        />
      )}
    </PageContainer>
  );
};

export default Plot;
