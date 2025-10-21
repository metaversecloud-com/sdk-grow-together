import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer, Accordion, Instructions } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { s3URL } from "@shared/constants";

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, plotAssetData, visitorPlotData } = useContext(GlobalStateContext);
  const { ownerId } = plotAssetData || {};
  const { plotAssetId } = visitorPlotData || { plotSquares: {} };
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);

  const profileId = searchParams.get("profileId");

  const isOwnedByCurrentUser = profileId === ownerId;

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
        <img src={`${s3URL}/GrowTogetherLogo.png`} alt="Grow Together Logo" style={{ height: "220px" }} />

        {plotAssetId && !isOwnedByCurrentUser && (
          <Accordion title="Looking for your garden?">
            <p>Howdy, gardener! You already have a garden. Click the button below to teleport to it.</p>

            <button className="btn mt-4" onClick={() => handleTeleportToPlot()}>
              Teleport to My Garden
            </button>
          </Accordion>
        )}

        <Accordion title="Need a garden? Start here.">
          <p>
            <b>Find a garden with an "Open Garden" sign.</b>
            Click it and then click "Start Your Garden" to get started.
          </p>
        </Accordion>

        <Instructions />
      </div>
    </PageContainer>
  );
};

export default Home;
