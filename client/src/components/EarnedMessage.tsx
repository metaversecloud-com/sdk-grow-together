import { useContext, useEffect } from "react";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { SET_EARNED_MESSAGE } from "@/context/types";

export const EarnedMessage = ({ isOwnedByCurrentUser }: { isOwnedByCurrentUser?: boolean }) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { earnedMessage } = useContext(GlobalStateContext);

  useEffect(() => {
    if (earnedMessage) {
      // Clear the earned message after displaying it for 8 seconds
      setTimeout(() => {
        dispatch!({
          type: SET_EARNED_MESSAGE,
          payload: { earnedMessage: undefined },
        });
      }, 8000);
    }
  }, [earnedMessage]);

  return (
    <>
      {/* Rewards Earned (by non-owners) */}
      {!isOwnedByCurrentUser && earnedMessage && (
        <>
          <div className="card success">
            <div className="card-details text-center">
              {earnedMessage.multiplier && <strong>{earnedMessage.multiplier} </strong>}
              <span className="text-success">{earnedMessage.message}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default EarnedMessage;
