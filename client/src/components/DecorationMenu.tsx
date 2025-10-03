import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { decorations, VisitorDataObjectType } from "@shared/index.js";

interface DecorationMenuProps {
  visitorData: VisitorDataObjectType;
  onClose: () => void;
}

export const DecorationMenu = ({ visitorData, onClose }: DecorationMenuProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const [purchasingDecorations, setPurchasingDecorations] = useState<Set<number>>(new Set());
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchaseDecoration = async (decorationId: number) => {
    setPurchasingDecorations((prev) => new Set([...prev, decorationId]));
    setIsPurchasing(true);
    await backendAPI
      .post("/decoration/purchase", { decorationId })
      .then((response) => {
        dispatch!({
          type: SET_VISITOR_DATA,
          payload: { visitorData: response.data.visitorData, error: "" },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => {
        setPurchasingDecorations((prev) => {
          const updated = new Set(prev);
          updated.delete(decorationId);
          return updated;
        });
        setIsPurchasing(false);
      });
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <h2 className="h2">⛲ Decoration Menu</h2>

        <div className="card small">
          <div className="card-details">
            <h4 className="card-title">💰 {visitorData.coinsAvailable} Coins Available</h4>
            <p className="p3">Total Earned: {visitorData.totalCoinsEarned}</p>
          </div>
        </div>

        <div className="grid gap-2">
          {Object.values(decorations).map((decoration) => {
            const affordable = visitorData.coinsAvailable >= decoration.cost;

            return (
              <div key={decoration.id} className={`card small text-left ${!affordable ? "opacity-50" : ""}`}>
                <div className="card-image">
                  <img className="mr-2" src={decoration.imageSrc} />
                </div>
                <div className="card-details">
                  <h4 className="card-title">{decoration.name}</h4>

                  <p className="card-description p2">
                    Cost: {decoration.cost} coins
                    <br />
                    Available: {visitorData.decorationsOwned[decoration.id].quantity || 0}
                  </p>

                  <div className="card-actions">
                    {affordable ? (
                      <button
                        className="btn btn-outline"
                        onClick={() => handlePurchaseDecoration(decoration.id)}
                        disabled={isPurchasing}
                      >
                        {purchasingDecorations.has(decoration.id) ? "Purchasing..." : "Purchase"}
                      </button>
                    ) : (
                      <span className="p3 text-muted">
                        Need {decoration.cost - visitorData.coinsAvailable} more coins
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="actions">
          <button className="btn" onClick={onClose}>
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default DecorationMenu;
