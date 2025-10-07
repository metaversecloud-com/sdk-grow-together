import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_DECORATION_DATA, SET_VISITOR_PLOT_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";
import { decorations } from "@shared/constants";
import { DecorationType } from "@shared/types";

export const Decoration = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, decorationData, visitorPlotData } = useContext(GlobalStateContext);
  const { ownerId, ownerName } = decorationData || {};

  const [searchParams] = useSearchParams();

  const [decorationConfig, setDecorationConfig] = useState<DecorationType>();
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
              type: SET_DECORATION_DATA,
              payload: { decorationData: squareData, error: "" },
            });
            dispatch!({
              type: SET_VISITOR_PLOT_DATA,
              payload: { visitorPlotData, error: "" },
            });
            setDecorationConfig(decorations[squareData?.decorationId || 0]);
          }
        })
        .catch((error) => setErrorMessage(dispatch, error as ErrorType))
        .finally(() => setIsLoading(false));
    }
  }, [hasInteractiveParams]);

  const handleOpenPlotIframe = async () => {
    await backendAPI.post("/plot/view", { plotAssetId: visitorPlotData?.plotAssetId }).catch((error) => {
      setErrorMessage(dispatch, error as ErrorType);
    });
  };

  if (!decorationConfig) return;

  return (
    <PageContainer isLoading={isLoading} headerText={`Slot ${decorationData?.squareId || ""}`}>
      <div className="container grid gap-2">
        {/* Decoration owned by another user */}
        {!isOwnedByCurrentUser && (
          <div className="grid gap-4">
            <p className="pb-2 text-center">This decoration belongs to {ownerName || "another player"}</p>
          </div>
        )}

        <div className="card small">
          <div className="card-details" style={{ maxWidth: "100%" }}>
            <img className="m-auto" src={decorationConfig.imageSrc} />
            <div className="text-center">
              <h3 className="card-title">{decorationConfig.name}</h3>
              <p className="text-muted">({decorationConfig.rarity})</p>
            </div>
          </div>
        </div>

        {visitorPlotData?.plotAssetId && (
          <button className="btn btn-outline" onClick={handleOpenPlotIframe}>
            View Plot
          </button>
        )}
      </div>
    </PageContainer>
  );
};

export default Decoration;
