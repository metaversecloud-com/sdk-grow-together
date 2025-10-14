import { useContext, useState } from "react";

// components
import { ModalHeader, PurchaseItem, YourMoney } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_INVENTORY } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const DecorationMenu = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { decorations, visitorInventory = {} } = useContext(GlobalStateContext);

  const [purchasingDecorations, setPurchasingDecorations] = useState<Set<string>>(new Set());
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchaseDecoration = async (decorationId: string) => {
    setPurchasingDecorations((prev) => new Set([...prev, decorationId]));
    setIsPurchasing(true);
    await backendAPI
      .post("/decoration/purchase", { decorationId })
      .then((response) => {
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory: response.data.visitorInventory, error: "" },
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

        <YourMoney coinsAvailable={visitorInventory["Coins"]?.quantity || 0} />

        <div className="grid grid-cols-2 gap-2">
          {decorations &&
            Object.values(decorations).map((decoration) => {
              const { id, name, description, rarity, cost, imageSrc } = decoration;

              return (
                <PurchaseItem
                  key={id}
                  coinsAvailable={visitorInventory["Coins"]?.quantity || 0}
                  id={id}
                  imageSrc={imageSrc}
                  name={name}
                  description={description}
                  rarity={rarity}
                  cost={cost}
                  value={`Owned: ${visitorInventory[id]?.quantity || 0}`}
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
