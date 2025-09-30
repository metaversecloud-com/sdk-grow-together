import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer } from "@/components";
import { PlantDetails } from "@/components/PlantDetails";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_PLANT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const GardenPlant = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, plantData } = useContext(GlobalStateContext);

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);

  const ownerProfileId = searchParams.get("ownerProfileId");
  const ownerName = searchParams.get("ownerName");
  const profileId = searchParams.get("profileId");

  const isOwnedByCurrentUser = ownerProfileId === profileId;

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/plant")
        .then((response) => {
          const { success, plantData } = response.data;
          if (success) {
            dispatch!({
              type: SET_PLANT_DATA,
              payload: { plantData, error: "" },
            });
            console.log(`Watered! Your plant just grew by 1 level.`);
          }
        })
        .catch((error) => setErrorMessage(dispatch, error as ErrorType))
        .finally(() => setIsLoading(false));
    }
  }, [hasInteractiveParams]);

  return (
    <PageContainer isLoading={isLoading} headerText="Garden Plant">
      <div className="container">
        {plantData ? (
          <>
            {/* Plant owned by another user */}
            {!isOwnedByCurrentUser && (
              <div className="grid gap-4">
                <p className="pb-2 text-center">This plant belongs to {ownerName || "another player"}</p>
                <PlantDetails plant={plantData} isReadOnly={true} />
              </div>
            )}

            {/* Current user's plant */}
            {isOwnedByCurrentUser && <PlantDetails plant={plantData} isReadOnly={false} />}
          </>
        ) : (
          <p className="p2">No plant data found.</p>
        )}
      </div>
    </PageContainer>
  );
};

export default GardenPlant;
