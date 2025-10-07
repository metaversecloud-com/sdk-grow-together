import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PlotGrid, SeedMenu, PageContainer, DecorationMenu } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

export const Plot = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, plotAssetData, visitorData, visitorPlotData } = useContext(GlobalStateContext);
  const { ownerId, ownerName } = plotAssetData || {};
  const { coinsAvailable } = visitorData || {};
  const { plotAssetId, plotSquares, crops, decorations } = visitorPlotData || { plotSquares: {} };

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showSeedMenu, setShowSeedMenu] = useState(false);
  const [showDecorationMenu, setShowDecorationMenu] = useState(false);

  const profileId = searchParams.get("profileId");

  const isOwnedByCurrentUser = profileId === ownerId;
  const isOwnedByOtherUser = ownerId && ownerId !== profileId;

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
      .then((response) => {
        setGameState(dispatch, response.data);
      })
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
    <PageContainer isLoading={isLoading} headerText={`${isOwnedByOtherUser ? `${ownerName}'s` : "Your"} Garden`}>
      <div className="container">
        {/* Plot owned by another user */}
        {isOwnedByOtherUser && (
          <div className="grid gap-2">
            <h3>Plot Owned by {ownerName}</h3>
            <p>This plot belongs to another player. You can view their garden but cannot make changes.</p>
          </div>
        )}

        {/* Current user doesn't own any plot - show claim option */}
        {!isOwnedByOtherUser && !plotAssetId && (
          <div className="grid gap-2">
            <h3>Claim This Plot</h3>
            <p>This plot is available! Claim it to start your garden.</p>
            <p className="p3 text-muted">Note: You can only claim one plot per world.</p>

            <button className="btn" onClick={handleClaimPlot} disabled={isClaiming}>
              {isClaiming ? "Claiming..." : "Claim This Plot"}
            </button>
          </div>
        )}

        {/* Current user already owns a different plot */}
        {!isOwnedByOtherUser && plotAssetId && !isOwnedByCurrentUser && (
          <div className="grid gap-2">
            <h3>Cannot Claim Plot</h3>
            <p>You already own a plot! Each player can only claim one plot.</p>
          </div>
        )}

        {/* Current user's plot */}
        {isOwnedByCurrentUser && plotAssetId && (
          <div className="grid gap-4">
            <h4>Garden Store</h4>
            <div className="card small">
              <div className="card-details text-center">
                <p className="card-title">
                  <b>Your Money:</b> {coinsAvailable} Coins
                </p>
              </div>
            </div>

            <div className="grid gap-2 grid-cols-2">
              <button className="btn btn-outline p2 crop" onClick={() => setShowSeedMenu(true)}>
                Buy Seeds
              </button>
              <button className="btn btn-outline p2 decoration" onClick={() => setShowDecorationMenu(true)}>
                Buy Decorations
              </button>
            </div>
            <hr className="my-2" />
            <h4>Garden Plot</h4>
            <PlotGrid
              plotSquares={plotSquares}
              crops={crops || {}}
              placedDecorations={decorations || {}}
              isReadOnly={false}
              visitorData={visitorData}
            />
          </div>
        )}

        {/* Current user already owns a different plot */}
        {plotAssetId && !isOwnedByCurrentUser && (
          <button className="btn btn-outline mt-4" onClick={() => handleTeleportToPlot()}>
            <img alt="Teleport" className="mr-1" src="https://sdk-style.s3.amazonaws.com/icons/walk.svg" />
            Teleport to my plot
          </button>
        )}
      </div>
      {showSeedMenu && <SeedMenu visitorData={visitorData!} onClose={() => setShowSeedMenu(false)} />}
      {showDecorationMenu && <DecorationMenu visitorData={visitorData!} onClose={() => setShowDecorationMenu(false)} />}
    </PageContainer>
  );
};

export default Plot;
