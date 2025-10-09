import { useContext, useState } from "react";

// components
import { ModalHeader, PurchaseItem, YourMoney } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { decorations } from "@shared/index.js";

export const DecorationMenu = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorData } = useContext(GlobalStateContext);
  const { coinsAvailable, decorationsOwned } = visitorData || { coinsAvailable: 0 };

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

        <YourMoney coinsAvailable={coinsAvailable || 0} />

        <div className="grid grid-cols-2 gap-2">
          {Object.values(decorations).map((decoration) => {
            const { id, name, description, rarity, cost, imageSrc } = decoration;
            const affordable = coinsAvailable >= cost;

            return (
              <PurchaseItem
                key={id}
                coinsAvailable={coinsAvailable || 0}
                id={id}
                available={affordable}
                imageSrc={imageSrc}
                name={name}
                description={description}
                rarity={rarity}
                cost={cost}
                value={`Owned: ${decorationsOwned?.[id]?.owned || 0}`}
                canPurchaseAdditional={true}
                isPurchasing={purchasingDecorations.has(id)}
                handlePurchase={() => handlePurchaseDecoration(id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DecorationMenu;
