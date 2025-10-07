import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer } from "@/components";
import { CropDetails } from "@/components/CropDetails";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_CROP_DATA, SET_VISITOR_PLOT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const Crop = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, cropData, visitorPlotData } = useContext(GlobalStateContext);
  const { ownerId, ownerName } = cropData || {};

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);

  const profileId = searchParams.get("profileId");

  const isOwnedByCurrentUser = ownerId === profileId;

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/square")
        .then((response) => {
          const { success, squareData, visitorPlotData } = response.data;
          if (success) {
            dispatch!({
              type: SET_CROP_DATA,
              payload: { cropData: squareData, error: "" },
            });
            dispatch!({
              type: SET_VISITOR_PLOT_DATA,
              payload: { visitorPlotData, error: "" },
            });
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
              <div className="grid gap-4">
                <p className="pb-2 text-center">This crop belongs to {ownerName || "another player"}</p>
                <CropDetails crop={cropData} plotAssetId={visitorPlotData?.plotAssetId} isReadOnly={true} />
              </div>
            )}

            {/* Current user's crop */}
            {isOwnedByCurrentUser && (
              <CropDetails crop={cropData} plotAssetId={visitorPlotData?.plotAssetId} isReadOnly={false} />
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
