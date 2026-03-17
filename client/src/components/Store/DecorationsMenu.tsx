import { useContext, useState } from "react";

// components
import { InventoryItem } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { DEDUCT_COINS, ErrorType, SET_VISITOR_INVENTORY } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const DecorationsMenu = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { ecosystemDecorations, visitorInventory = { coins: 0 } } = useContext(GlobalStateContext);

  const [purchasingDecorations, setPurchasingDecorations] = useState<Set<string>>(new Set());

  const handlePurchaseDecoration = async (decorationId: string) => {
    const cost = ecosystemDecorations?.[decorationId]?.cost ?? 0;
    setPurchasingDecorations((prev) => new Set([...prev, decorationId]));
    dispatch!({ type: DEDUCT_COINS, payload: { amount: cost } });
    await backendAPI
      .post("/decoration/purchase", { decorationId })
      .then((response) => {
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory: response.data.visitorInventory, error: "" },
        });
      })
      .catch((error) => {
        dispatch!({ type: DEDUCT_COINS, payload: { amount: -cost } });
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setPurchasingDecorations((prev) => {
          const updated = new Set(prev);
          updated.delete(decorationId);
          return updated;
        });
      });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {ecosystemDecorations &&
          Object.values(ecosystemDecorations).map((decoration) => {
            const { name, rarity, cost, icon } = decoration;

            return (
              <InventoryItem
                key={decoration.id}
                coinsAvailable={visitorInventory.coins}
                icon={icon}
                name={name}
                rarity={rarity}
                cost={cost}
                isPurchasing={purchasingDecorations.has(decoration.id)}
                handlePurchase={() => handlePurchaseDecoration(decoration.id)}
                isReadyOnly={false}
              />
            );
          })}
      </div>
    </div>
  );
};

export default DecorationsMenu;
