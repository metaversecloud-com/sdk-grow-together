import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer } from "@/components";
import { PlantDetails } from "@/components/PlantDetails";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

export const GardenPlant = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, visitorData } = useContext(GlobalStateContext);
  const { plants } = visitorData || {};

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);

  const ownerProfileId = searchParams.get("ownerProfileId");
  const ownerName = searchParams.get("ownerName");
  const profileId = searchParams.get("profileId");
  const assetId = searchParams.get("assetId");

  const isOwnedByCurrentUser = ownerProfileId === profileId;

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

  // Find the specific plant data
  const plant = assetId && plants ? plants[assetId] : null;

  return (
    <PageContainer isLoading={isLoading} headerText="Garden Plant">
      <div className="container">
        {/* Plant owned by another user */}
        {!isOwnedByCurrentUser && (
          <div className="card">
            <div className="card-details">
              <h2 className="h2">Plant Details</h2>
              <p className="p2">This plant belongs to {ownerName || "another player"}</p>
              {/* <PlantDetails plant={plant} isReadOnly={true} /> */}
            </div>
          </div>
        )}

        {/* Current user's plant */}
        {isOwnedByCurrentUser && plant && (
          <PlantDetails plant={plant} plantAssetId={assetId || ""} isReadOnly={false} />
        )}
      </div>
    </PageContainer>
  );
};

export default GardenPlant;
