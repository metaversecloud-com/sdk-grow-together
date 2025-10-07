import { useContext, useState } from "react";

// components
import { ModalHeader, PurchaseItem, YourMoney } from "@/components";

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
        <ModalHeader text="Buy Decorations" disabled={isPurchasing} handleOnClick={onClose} />

        <YourMoney coinsAvailable={visitorData.coinsAvailable || 0} />

        <div className="grid grid-cols-2 gap-2">
          {Object.values(decorations).map((decoration) => {
            const affordable = visitorData.coinsAvailable >= decoration.cost;

            return (
              <PurchaseItem
                coinsAvailable={visitorData.coinsAvailable || 0}
                id={decoration.id}
                available={affordable}
                imageSrc={decoration.imageSrc}
                name={decoration.name}
                description={decoration.description}
                rarity={decoration.rarity}
                cost={decoration.cost}
                value={`Available: ${visitorData.decorationsOwned?.[decoration.id]?.quantity || 0}`}
                canPurchaseAdditional={true}
                isPurchasing={purchasingDecorations.has(decoration.id)}
                handlePurchase={() => handlePurchaseDecoration(decoration.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DecorationMenu;
