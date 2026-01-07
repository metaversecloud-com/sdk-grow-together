import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const NewUserInfo = ({
  visitorPlotAssetId,
  noOfAvailablePlots = 0,
  showHeaders,
}: {
  visitorPlotAssetId?: string | null;
  noOfAvailablePlots?: number;
  showHeaders: boolean;
}) => {
  const dispatch = useContext(GlobalDispatchContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleTeleportToOpenPlot = async () => {
    setIsLoading(true);
    await backendAPI
      .post("/teleport")
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      {!visitorPlotAssetId && noOfAvailablePlots > 0 && (
        <>
          {showHeaders && <h4>Ready to start your garden?</h4>}
          <p className="p2">
            Click the button below to teleport to an open garden and then click the "Start Your Garden".
          </p>
          <button className="btn" disabled={isLoading} onClick={() => handleTeleportToOpenPlot()}>
            {isLoading ? "Teleporting..." : "Teleport to Open Garden"}
          </button>
        </>
      )}

      {noOfAvailablePlots === 0 && (
        <>
          {showHeaders && <h4>There are no open gardens.</h4>}
          <p className="p2">Sorry, gardener! Try asking an admin in this world to add more gardens.</p>
        </>
      )}
    </>
  );
};

export default NewUserInfo;
