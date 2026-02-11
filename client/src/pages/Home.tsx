import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer, Accordion, Instructions, NewUserInfo } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { s3URL } from "@shared/constants";

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, noOfAvailablePlots, plotAssetData, visitorPlotAssetId } =
    useContext(GlobalStateContext);
  const { ownerId } = plotAssetData || {};
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);

  const profileId = searchParams.get("profileId");
  const forceRefreshInventory = searchParams.get("forceRefreshInventory") === "true";

  const isOwnedByCurrentUser = profileId === ownerId;

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/game-state", { params: { forceRefreshInventory } })
        .then((response) => {
          setGameState(dispatch, response.data);
        })
        .catch((error) => setErrorMessage(dispatch, error as ErrorType))
        .finally(() => setIsLoading(false));
    }
  }, [hasInteractiveParams]);

  const handleTeleportToPlot = async () => {
    setIsLoading(true);
    await backendAPI
      .post("/plot/teleport")
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => setIsLoading(false));
  };

  return (
    <PageContainer isLoading={isLoading}>
      <div className="container grid gap-2">
        <img src={`${s3URL}/Logo.png`} alt="Grow Together Logo" style={{ height: "220px" }} />

        {visitorPlotAssetId && !isOwnedByCurrentUser && (
          <Accordion title="Looking for your garden?">
            <p className="p2">Howdy, gardener! You already have a garden. Click the button below to teleport to it.</p>

            <button className="btn" onClick={() => handleTeleportToPlot()}>
              Teleport to My Garden
            </button>
          </Accordion>
        )}

        <Accordion title="Need a garden? Start here.">
          <NewUserInfo
            visitorPlotAssetId={visitorPlotAssetId}
            noOfAvailablePlots={noOfAvailablePlots}
            showHeaders={false}
          />
        </Accordion>

        <Instructions />
      </div>
    </PageContainer>
  );
};

export default Home;
