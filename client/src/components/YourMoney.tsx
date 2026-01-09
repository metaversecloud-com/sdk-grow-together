import { useContext, useEffect, useState } from "react";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { SET_EARNED_MESSAGE } from "@/context/types";

export const YourMoney = ({ coinsAvailable }: { coinsAvailable: number }) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { earnedMessage } = useContext(GlobalStateContext);

  const [showEarnedMessage, setShowEarnedMessage] = useState(false);

  useEffect(() => {
    if (earnedMessage) {
      setShowEarnedMessage(true);
      // Clear the earned message after displaying it for 8 seconds
      setTimeout(() => {
        setShowEarnedMessage(false);
        dispatch!({
          type: SET_EARNED_MESSAGE,
          payload: { earnedMessage: undefined },
        });
      }, 8000);
    }
  }, [earnedMessage]);

  return (
    <div className="card small">
      <div className="card-details text-center">
        <p className="card-title">
          {showEarnedMessage && earnedMessage ? (
            <>
              {earnedMessage.multiplier && <strong>{earnedMessage.multiplier} </strong>}
              <span className="text-success">{earnedMessage.message}</span>
            </>
          ) : (
            <>
              {" "}
              <b>Your Money:</b> <span className="text-success">{coinsAvailable} Coins</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
