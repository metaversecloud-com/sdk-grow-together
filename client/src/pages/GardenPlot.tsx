import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer } from "@/components";
import { PlotGrid } from "@/components/PlotGrid";
import { SeedMenu } from "@/components/SeedMenu";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

export const GardenPlot = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, plotData, visitorData } = useContext(GlobalStateContext);
  const { ownerId, ownerName } = plotData || {};
  const { ownedPlot, plants, coinsAvailable, totalCoinsEarned } = visitorData || {};

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [showSeedMenu, setShowSeedMenu] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const profileId = searchParams.get("profileId");

  const isOwnedByCurrentUser = profileId === ownerId;
  const isOwnedByOtherUser = ownerId && ownerId !== profileId;

  useEffect(() => {
    if (hasInteractiveParams) loadGameState();
  }, [hasInteractiveParams]);

  const loadGameState = async () => {
    backendAPI
      .get("/game-state")
      .then((response) => {
        setGameState(dispatch, response.data);
      })
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => setIsLoading(false));
  };

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

  // Show seed menu overlay
  if (visitorData && showSeedMenu && isOwnedByCurrentUser) {
    return <SeedMenu visitorData={visitorData} onClose={() => setShowSeedMenu(false)} />;
  }

  return (
    <PageContainer isLoading={isLoading} headerText="Garden Plot">
      <div className="container">
        {/* Plot owned by another user */}
        {isOwnedByOtherUser && (
          <div className="grid gap-2">
            <h3>Plot Owned by {ownerName}</h3>
            <p>This plot belongs to another player. You can view their garden but cannot make changes.</p>

            {/* {ownedPlot && (
              <div className="flex-col">
                <p className="p3 text-muted">Claimed on: {new Date(ownedPlot.claimedDate).toLocaleDateString()}</p>
                <PlotGrid plotSquares={ownedPlot.plotSquares} plants={plants || {}} isReadOnly={true} />
              </div>
            )} */}
          </div>
        )}

        {/* Current user doesn't own any plot - show claim option */}
        {!isOwnedByOtherUser && !ownedPlot && (
          <div className="grid gap-2">
            <h3>Claim This Plot</h3>
            <p>This plot is available! Claim it to start your garden.</p>
            <p className="p3 text-muted">Note: You can only claim one plot per account.</p>

            <button className="btn" onClick={handleClaimPlot} disabled={isClaiming}>
              {isClaiming ? "Claiming..." : "Claim This Plot"}
            </button>
          </div>
        )}

        {/* Current user already owns a different plot */}
        {!isOwnedByOtherUser && ownedPlot && !isOwnedByCurrentUser && (
          <div className="grid gap-2">
            <h3>Cannot Claim Plot</h3>
            <p>You already own a plot! Each player can only claim one plot.</p>
          </div>
        )}

        {/* Current user's plot */}
        {isOwnedByCurrentUser && ownedPlot && (
          <div className="grid gap-4">
            <div className="card small">
              <div className="card-details text-center">
                <h3 className="card-title">💰 {coinsAvailable} Coins</h3>
                <p className="p3">Total Earned: {totalCoinsEarned}</p>
              </div>
            </div>

            <PlotGrid
              plotSquares={ownedPlot.plotSquares}
              plants={plants || {}}
              isReadOnly={false}
              gameState={visitorData}
              onStateUpdate={loadGameState}
            />

            <div className="flex items-center justify-center">
              <button className="btn btn-outline" onClick={() => setShowSeedMenu(true)}>
                🌱 Open Seed Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default GardenPlot;
