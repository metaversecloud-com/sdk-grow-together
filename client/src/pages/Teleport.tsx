import { useContext, useEffect, useState } from "react";

// components
import { NewUserInfo, PageContainer } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

export const Teleport = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, noOfAvailablePlots, visitorPlotData } = useContext(GlobalStateContext);
  const { plotAssetId } = visitorPlotData || { plotSquares: {} };

  const [isLoading, setIsLoading] = useState(true);

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
        <div className="flex-grid">
          <div className="chip mb-2">
            {noOfAvailablePlots === 1 ? `There is 1 open garden` : `There are ${noOfAvailablePlots} open gardens`}
          </div>
          <div className="flex-grow" />
        </div>

        <NewUserInfo plotAssetId={plotAssetId} noOfAvailablePlots={noOfAvailablePlots} showHeaders={true} />

        {plotAssetId && (
          <>
            <h4>Looking for your garden?</h4>
            <p className="p2">Howdy, gardener! You already have a garden. Click the button below to teleport to it.</p>
            <button className="btn" onClick={() => handleTeleportToPlot()}>
              Teleport to My Garden
            </button>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Teleport;
