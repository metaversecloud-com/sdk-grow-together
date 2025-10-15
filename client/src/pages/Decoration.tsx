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
    visitorPlotData,
    visitorInventory = {},
    decorations = {},
  } = useContext(GlobalStateContext);
  const { ownerId, ownerName } = decorationData || {};
  const { icon, name, rarity, description, cost } = decorationData?.decorationId
    ? decorations[decorationData.decorationId]
    : {};

  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);

  const profileId = searchParams.get("profileId");
  const isOwnedByCurrentUser = ownerId === profileId;

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
    await backendAPI.post("/plot/view", { plotAssetId: visitorPlotData?.plotAssetId }).catch((error) => {
      setErrorMessage(dispatch, error as ErrorType);
    });
  };

  return (
    <PageContainer isLoading={isLoading} headerText={`Slot ${decorationData?.squareId || ""}`}>
      <div className="container grid gap-2">
        {/* Decoration owned by another user */}
        {isOwnedByCurrentUser && <YourMoney coinsAvailable={visitorInventory["Coins"]?.quantity || 0} />}

        <div className="card small">
          <div className="card-details" style={{ maxWidth: "100%" }}>
            <img className="m-auto" src={icon} />
            <div className="text-center grid gap-1">
              <h3 className="card-title">{name}</h3>
              <p className={`${rarity}`}></p>
              <p className="p2">{description}</p>
              <p className="text-success">{cost} Coins</p>
              {!isOwnedByCurrentUser && <div className="chip m-auto mt-2">Owned by {ownerName}</div>}
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
