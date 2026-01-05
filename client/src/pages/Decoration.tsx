import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import { PageContainer, YourMoney } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_DECORATION_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

export const Decoration = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const {
    hasInteractiveParams,
    decorationData,
    plotData,
    visitorInventory = { coins: 0 },
    decorations = {},
  } = useContext(GlobalStateContext);
  const { plotAssetId: decorationPlotAssetId, ownerId, ownerName } = decorationData || {};
  const { icon, name, rarity, description, cost } = decorationData?.decorationId
    ? decorations[decorationData.decorationId]
    : {};

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);

  const profileId = searchParams.get("profileId");
  const isOwnedByCurrentUser = ownerId === profileId;

  let plotAssetId = decorationPlotAssetId;
  if (isOwnedByCurrentUser && !decorationPlotAssetId && plotData?.plotAssetId) plotAssetId = plotData.plotAssetId;

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/square")
        .then((response) => {
          const { success, squareData } = response.data;
          if (success) {
            dispatch!({
              type: SET_DECORATION_DATA,
              payload: { decorationData: squareData, error: "" },
            });
            setGameState(dispatch, response.data);
          }
        })
        .catch((error) => setErrorMessage(dispatch, error as ErrorType))
        .finally(() => setIsLoading(false));
    }
  }, [hasInteractiveParams]);

  const handleOpenPlotIframe = async () => {
    await backendAPI.post("/plot/view", { plotAssetId }).catch((error) => {
      setErrorMessage(dispatch, error as ErrorType);
    });
  };

  return (
    <PageContainer isLoading={isLoading} headerText={`Slot ${decorationData?.squareId || ""}`}>
      {!isOwnedByCurrentUser && <div className="chip chip-muted mb-2">Owned by {ownerName}</div>}

      <div className="grid gap-2">
        {isOwnedByCurrentUser && <YourMoney coinsAvailable={visitorInventory.coins || 0} />}

        <div className="card small">
          <div className="card-details" style={{ maxWidth: "100%" }}>
            <img className="m-auto" src={icon} style={{ width: "40px", height: "40px" }} />
            <div className="text-center grid gap-1">
              <h3 className="card-title bold">{name}</h3>
              <p className="text-muted">
                <i>{rarity}</i>
              </p>
              <p className="p2">{description}</p>
              <p className="text-success">{cost} Coins</p>
            </div>
          </div>
        </div>

        {plotAssetId && (
          <button className="btn btn-outline" onClick={handleOpenPlotIframe}>
            View Plot
          </button>
        )}
      </div>
    </PageContainer>
  );
};

export default Decoration;
