import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer, YourMoney } from "@/components";
import { CropDetails } from "@/components/CropDetails";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_CROP_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

export const Crop = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, cropData, visitorPlotData, visitorInventory = {} } = useContext(GlobalStateContext);
  const { ownerId } = cropData || {};

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);

  const profileId = searchParams.get("profileId");

  const isOwnedByCurrentUser = ownerId === profileId;

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get(`/square${visitorPlotData?.plotAssetId ? `?plotAssetId=${visitorPlotData.plotAssetId}` : ""}`)
        .then((response) => {
          const { success, squareData } = response.data;
          if (success) {
            dispatch!({
              type: SET_CROP_DATA,
              payload: { cropData: squareData, error: "" },
            });
            setGameState(dispatch, response.data);
          }
        })
        .catch((error) => setErrorMessage(dispatch, error as ErrorType))
        .finally(() => setIsLoading(false));
    }
  }, [hasInteractiveParams]);

  return (
    <PageContainer isLoading={isLoading} headerText={`Slot ${cropData?.squareId || ""}`}>
      <div className="container">
        {cropData ? (
          <>
            {/* Crop owned by another user */}
            {!isOwnedByCurrentUser && (
              <CropDetails crop={cropData} plotAssetId={visitorPlotData?.plotAssetId} isReadOnly={true} />
            )}

            {/* Current user's crop */}
            {isOwnedByCurrentUser && (
              <div className="grid gap-2">
                <YourMoney coinsAvailable={visitorInventory["Coins"]?.quantity || 0} />
                <CropDetails crop={cropData} plotAssetId={visitorPlotData?.plotAssetId} isReadOnly={false} />
              </div>
            )}
          </>
        ) : (
          <p className="p2">No crop data found.</p>
        )}
      </div>
    </PageContainer>
  );
};

export default Crop;
